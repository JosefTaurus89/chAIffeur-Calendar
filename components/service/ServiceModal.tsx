
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Service, ServiceStatus, ServiceType, ExtractedReservation, User, Supplier, PaymentStatus, AppSettings, Vehicle } from '../../types';
import { ReservationExtractor } from '../ai/ReservationExtractor';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../services/googleCalendarService';
import { useTranslation } from '../../hooks/useTranslation';
import { EVENT_COLORS } from '../../constants';


interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  service?: Partial<Service>;
  drivers: User[];
  suppliers: Supplier[];
  vehicles: Vehicle[];
  isLoggedIn: boolean;
  settings: AppSettings;
  onDelete?: (serviceId: string) => void;
  existingServices?: Service[]; // Optional, pass full list to extract agency names
}

// Generate Time Slots (15 mins)
const generateTimeSlots = (timeFormat: '12h' | '24h') => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const date = new Date();
            date.setHours(h, m, 0, 0);
            const label = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h' });
            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; // HH:MM 24h format for internal value
            slots.push({ value, label });
        }
    }
    return slots;
};

const getLocalDateString = (date: Date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getLocalTimeString = (date: Date) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours.padStart(2,'0')}:${minutes.padStart(2,'0')}`; 
};

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, service, drivers, suppliers, vehicles, isLoggedIn, settings, onDelete, existingServices }) => {
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [error, setError] = useState<string | null>(null);
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'INTERNAL' | 'OUTSOURCED'>('INTERNAL');
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [isAgencyBooking, setIsAgencyBooking] = useState(false);
  const [isDirectBooking, setIsDirectBooking] = useState(false);
  
  const timeSlots = useMemo(() => generateTimeSlots(settings.timeFormat), [settings.timeFormat]);
  const { t } = useTranslation(settings.language);
  
  // Currency Symbol Helper
  const currencySymbol = useMemo(() => {
      if (settings.currency === 'EUR') return '€';
      if (settings.currency === 'GBP') return '£';
      return '$';
  }, [settings.currency]);

  const sortedDrivers = useMemo(() => {
      return [...drivers].sort((a, b) => a.availability === 'Available' ? -1 : 1);
  }, [drivers]);

  const activeVehicles = useMemo(() => {
      return vehicles.filter(v => v.status === 'Active');
  }, [vehicles]);

  const validSuppliers = useMemo(() => suppliers.filter(s => s.name), [suppliers]);
  
  // Extract unique previous agency names for autocomplete
  const agencySuggestions = useMemo(() => {
      if (!existingServices) return [];
      const names = new Set(existingServices.map(s => s.agencyName).filter(Boolean));
      return Array.from(names).sort();
  }, [existingServices]);

  const isPrepaid = useMemo(() => {
      const method = formData.paymentMethod?.toLowerCase() || '';
      return method.includes('prepaid') || method.includes('invoice');
  }, [formData.paymentMethod]);

  const balanceDue = useMemo(() => {
    const price = formData.clientPrice || 0;
    const deposit = formData.deposit || 0;
    if (isPrepaid) return 0;
    return Math.max(0, price - deposit);
  }, [formData.clientPrice, formData.deposit, isPrepaid]);

  // Calculate cash explicitly held by the executor (Driver or Supplier)
  const cashHeldByExecutor = useMemo(() => {
      const price = formData.clientPrice || 0;
      const deposit = formData.deposit || 0;
      const extras = formData.extrasAmount || 0;
      const method = (formData.paymentMethod || '').toLowerCase();
      
      let cashFromService = 0;

      // Logic Update: If method involves Cash, Card, Driver, or Balance/Deposit, 
      // it is treated as collected by the driver/supplier on site.
      // 'Credit Card' usually means terminal/pos on site unless specifically marked 'Prepaid'
      if (
          method.includes('cash') || 
          method.includes('driver') || 
          method.includes('balance') ||
          method.includes('deposit') ||
          method.includes('card')
      ) {
          // Exception: If it explicitly says "Prepaid" or "Invoice", assume office collection.
          if (!method.includes('prepaid') && !method.includes('invoice')) {
               cashFromService = Math.max(0, price - deposit);
          }
      }
      
      // Assume Extras/Commissions are ALWAYS collected by the executor on site
      return cashFromService + extras;
  }, [formData.clientPrice, formData.deposit, formData.paymentMethod, formData.extrasAmount]);

  // Calculate Total Profit (Agency Gain)
  const totalProfit = useMemo(() => {
      const price = formData.clientPrice || 0;
      const cost = fulfillmentType === 'OUTSOURCED' ? (formData.supplierCost || 0) : 0; // Cost is 0 for internal (salary)
      const extras = formData.extrasAmount || 0; 
      return price - cost + extras;
  }, [formData.clientPrice, formData.supplierCost, formData.extrasAmount, fulfillmentType]);

  useEffect(() => {
    const defaultService: Partial<Service> = {
      id: `service-${Date.now()}`,
      status: ServiceStatus.CONFIRMED, // Always Confirmed
      serviceType: ServiceType.TRANSFER,
      startTime: new Date(),
      createdById: 'admin1', // Mock creator
      clientPaymentStatus: PaymentStatus.PAID, // Default PAID
      color: 'Default',
      passengersAdults: 1,
      passengersKids: 0,
      passengersLuggageBig: 0,
      passengersLuggageSmall: 0,
      agencyName: '',
      extrasAmount: 0,
      extrasInfo: '',
      isDirectBooking: true // Default to Direct Booking
    };
    
    if (service) { 
      const initialData = { ...defaultService, ...service };
      if (initialData.numberOfPassengers && (initialData.passengersAdults === undefined)) {
          initialData.passengersAdults = initialData.numberOfPassengers;
          initialData.passengersKids = 0;
      }

      setFormData(initialData);
      setSyncToGoogleCalendar(!!service.googleCalendarEventId);
      setFulfillmentType(service.supplierId ? 'OUTSOURCED' : 'INTERNAL');
      setIsAgencyBooking(!!initialData.agencyName);
      setIsDirectBooking(!!initialData.isDirectBooking);
    } else {
      // Round up to next hour for new services
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      defaultService.startTime = now;

      setFormData(defaultService);
      setSyncToGoogleCalendar(isLoggedIn);
      setFulfillmentType('INTERNAL');
      setIsAgencyBooking(false);
      setIsDirectBooking(true);
    }
    setError(null);
    setShowAIExtractor(false);
  }, [service, isOpen, isLoggedIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
  };

  const handleAgencyToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setIsAgencyBooking(isChecked);
      if (isChecked) {
          // Agency checked -> Uncheck Direct
          setIsDirectBooking(false);
          setFormData(prev => ({ ...prev, isDirectBooking: false }));
      } else {
          setFormData(prev => ({ ...prev, agencyName: '' }));
      }
  };

  const handleDirectBookingToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setIsDirectBooking(isChecked);
      setFormData(prev => ({ ...prev, isDirectBooking: isChecked }));
      if (isChecked) {
          // Direct checked -> Uncheck Agency
          setIsAgencyBooking(false);
          setFormData(prev => ({ ...prev, agencyName: '' }));
      }
  };

  // New Date/Time Handlers
  const handleDatePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateStr = e.target.value; // YYYY-MM-DD
      if (!dateStr) return;
      
      const current = new Date(formData.startTime || new Date());
      const [y, m, d] = dateStr.split('-').map(Number);
      
      const newDate = new Date(current);
      newDate.setFullYear(y, m - 1, d);
      
      setFormData(prev => ({ ...prev, startTime: newDate }));
  };

  const handleTimeSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const timeStr = e.target.value; // HH:MM
      if (!timeStr) return;
      
      const current = new Date(formData.startTime || new Date());
      const [h, m] = timeStr.split(':').map(Number);
      
      const newDate = new Date(current);
      newDate.setHours(h, m);
      
      setFormData(prev => ({ ...prev, startTime: newDate }));
  };

  const handleFulfillmentChange = (type: 'INTERNAL' | 'OUTSOURCED') => {
      setFulfillmentType(type);
      if (type === 'INTERNAL') {
          setFormData(prev => ({ ...prev, supplierId: undefined, supplierCost: undefined, supplierPaymentStatus: undefined }));
      } else {
          setFormData(prev => ({ ...prev, driverId: undefined, vehicleId: undefined }));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.clientName || !formData.pickupAddress || !formData.dropoffAddress || !formData.startTime) {
      setError("Please fill all required fields (Title, Name, Date, Time, Route).");
      return;
    }
    
    if (fulfillmentType === 'OUTSOURCED') {
        if (!formData.supplierId) {
             setError("Please select a supplier for outsourced service.");
             return;
        }
    } else {
         if (formData.supplierId) formData.supplierId = undefined;
    }

    if (formData.deposit && formData.clientPrice && formData.deposit > formData.clientPrice) {
        setError("Deposit cannot be greater than the total client price.");
        return;
    }

    // Calculate total passengers
    const totalPax = (formData.passengersAdults || 0) + (formData.passengersKids || 0);
    
    let finalServiceData = { 
        ...formData,
        numberOfPassengers: totalPax > 0 ? totalPax : 1
    } as Service;

    try {
        if (isLoggedIn && syncToGoogleCalendar) {
            if (finalServiceData.googleCalendarEventId) {
                await updateCalendarEvent(finalServiceData.googleCalendarEventId, finalServiceData);
            } else {
                const eventId = await createCalendarEvent(finalServiceData);
                finalServiceData.googleCalendarEventId = eventId;
            }
        } else if (finalServiceData.googleCalendarEventId) {
            // If sync is unchecked but event ID exists, user might want to keep it or unlink.
            // For now, we keep it unless explicitly deleted via delete function.
            // Or we could ask user if they want to delete from calendar.
            // delete finalServiceData.googleCalendarEventId; 
        }

        onSave(finalServiceData);

    } catch (error) {
        console.error("Failed to sync with Google Calendar", error);
        setError("Could not sync with Google Calendar. Please try again.");
    }
  };

  const handleDelete = async () => {
      if (onDelete && formData.id) {
          if (window.confirm(t('confirm_delete_service'))) {
              // Attempt to delete from Google Calendar if synchronized
              if (isLoggedIn && formData.googleCalendarEventId) {
                  try {
                      await deleteCalendarEvent(formData.googleCalendarEventId);
                  } catch (error) {
                      console.error("Failed to delete Google Calendar event, but proceeding with local delete.", error);
                  }
              }
              onDelete(formData.id);
              onClose();
          }
      }
  };

  const onExtraction = useCallback((data: ExtractedReservation, originalText: string) => {
    setError(null);
    setShowAIExtractor(false);
    
    // Determine booking mode based on agency presence
    const hasAgency = !!data.agencyName;
    setIsAgencyBooking(hasAgency);
    setIsDirectBooking(!hasAgency);

    setFormData(prev => {
        const existingNotes = prev.notes || '';
        let finalNotes = existingNotes;
        const newAiNotes = data.specialRequests;

        if (newAiNotes) {
            const aiHeader = 'AI Extracted Notes:';
            if (existingNotes) {
                finalNotes = `${existingNotes}\n\n---\n\n${aiHeader}\n${newAiNotes}`;
            } else {
                finalNotes = `${aiHeader}\n${newAiNotes}`;
            }
        }
        
        return {
            ...prev,
            title: data.title || prev.title || 'New Service',
            clientName: data.clientName || prev.clientName,
            clientEmail: data.clientEmail || prev.clientEmail,
            clientPhone: data.clientPhone || prev.clientPhone,
            pickupAddress: data.pickupAddress || prev.pickupAddress,
            stopAddress: data.stopAddress || prev.stopAddress,
            dropoffAddress: data.dropoffAddress || prev.dropoffAddress,
            passengersAdults: data.passengersAdults ?? data.numberOfPassengers ?? prev.passengersAdults ?? 1,
            passengersKids: data.passengersKids ?? prev.passengersKids ?? 0,
            passengersLuggageBig: data.luggageBig ?? prev.passengersLuggageBig ?? 0,
            passengersLuggageSmall: data.luggageSmall ?? prev.passengersLuggageSmall ?? 0,
            clientPrice: data.clientPrice ?? prev.clientPrice,
            deposit: data.deposit ?? prev.deposit, 
            startTime: data.pickupTime ? new Date(data.pickupTime) : prev.startTime,
            serviceType: data.serviceType || prev.serviceType,
            notes: finalNotes,
            flightNumber: data.flightNumber || prev.flightNumber,
            paymentMethod: data.paymentMethod || prev.paymentMethod,
            agencyName: data.agencyName || '',
            isDirectBooking: !hasAgency, // Update data state
            extrasAmount: data.extrasAmount || prev.extrasAmount,
            extrasInfo: data.extrasInfo || prev.extrasInfo,
            description: originalText || prev.description // Save original text extracted
        };
    });
  }, []);

  const inputStyles = "mt-1 block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400 py-2.5 px-3";
  const labelStyles = "block text-xs font-bold text-slate-500 uppercase tracking-wide dark:text-slate-400 mb-1";
  const sectionTitleStyles = "text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2";

  // Helper to match current time to a slot (or close to it)
  const currentTimeValue = getLocalTimeString(formData.startTime || new Date());

  // Dynamic Settlement Explanation
  const settlementDetails = useMemo(() => {
      if (fulfillmentType === 'INTERNAL') {
          if (cashHeldByExecutor > 0) {
              return {
                  text: t('driver_deposit_to_office', { amount: `${currencySymbol}${cashHeldByExecutor.toFixed(2)}` }),
                  color: 'text-orange-600 dark:text-orange-400',
                  subtext: `${t('driver_collected')}: ${currencySymbol}${cashHeldByExecutor.toFixed(2)}`
              };
          } else {
              return {
                  text: t('no_cash_handling'),
                  color: 'text-green-600 dark:text-green-400',
                  subtext: ''
              };
          }
      } else {
          // OUTSOURCED
          const cost = formData.supplierCost || 0;
          const netPayableToSupplier = cost - cashHeldByExecutor;
          
          if (netPayableToSupplier > 0) {
              // We owe them (They collected less than their cost)
              return {
                  text: t('company_owes_supplier', { amount: `${currencySymbol}${netPayableToSupplier.toFixed(2)}` }),
                  color: 'text-red-600 dark:text-red-400',
                  subtext: t('supplier_collected_shortfall', { collected: `${currencySymbol}${cashHeldByExecutor}`, cost: `${currencySymbol}${cost}` })
              };
          } else if (netPayableToSupplier < 0) {
              // They owe us (They collected more than cost)
              return {
                  text: t('supplier_owes_company', { amount: `${currencySymbol}${Math.abs(netPayableToSupplier).toFixed(2)}` }),
                  color: 'text-green-600 dark:text-green-400',
                  subtext: t('supplier_collected_surplus', { collected: `${currencySymbol}${cashHeldByExecutor}`, cost: `${currencySymbol}${cost}` })
              };
          } else {
              return {
                  text: t('settled'),
                  color: 'text-slate-600 dark:text-slate-400',
                  subtext: ''
              };
          }
      }
  }, [fulfillmentType, cashHeldByExecutor, formData.supplierCost, currencySymbol, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{service?.id ? t('edit_service') : t('create_service')}</h2>
             {service?.id && <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {service.id.slice(-6)}</p>}
          </div>
          <div className="flex items-center gap-3">
             {isLoggedIn && (
                <label className="hidden sm:flex items-center space-x-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
                    <input type="checkbox" checked={syncToGoogleCalendar} onChange={(e) => setSyncToGoogleCalendar(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    <span>{t('sync_gcal')}</span>
                </label>
             )}
             <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Toggle & Panel */}
          <div className="mb-6">
             <button 
                onClick={() => setShowAIExtractor(!showAIExtractor)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300 font-medium hover:from-indigo-100 hover:to-blue-100 transition-colors"
             >
                <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    {t('smart_paste_btn')}
                </span>
                <svg className={`w-5 h-5 transform transition-transform ${showAIExtractor ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </button>
             
             {showAIExtractor && (
                 <div className="mt-2 animate-fade-in-down border border-indigo-100 dark:border-indigo-800 rounded-lg overflow-hidden">
                     <ReservationExtractor onExtraction={onExtraction} />
                 </div>
             )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Logistics & Route */}
            <div className="space-y-8">
                
                {/* Date & Time & Type */}
                <div>
                    <h3 className={sectionTitleStyles}>
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {t('schedule')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyles}>{t('service_date')}</label>
                            <input 
                                type="date" 
                                name="serviceDate"
                                value={getLocalDateString(formData.startTime || new Date())}
                                onChange={handleDatePartChange}
                                className={inputStyles} 
                                required 
                            />
                        </div>
                        <div>
                            <label className={labelStyles}>{t('start_time')}</label>
                            <select
                                name="serviceTime"
                                value={currentTimeValue}
                                onChange={handleTimeSlotChange}
                                className={inputStyles}
                                required
                            >
                                {timeSlots.map((slot) => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                         <div>
                            <label className={labelStyles}>{t('flight_number')}</label>
                            <input type="text" name="flightNumber" value={formData.flightNumber || ''} onChange={handleChange} className={inputStyles} placeholder="e.g. AA123" />
                        </div>
                        <div>
                            <label className={labelStyles}>{t('service_type')}</label>
                            <select name="serviceType" value={formData.serviceType || ''} onChange={handleChange} className={inputStyles}>
                                {Object.keys(settings.serviceAliases).map(type => (
                                    <option key={type} value={type}>
                                        {settings.serviceAliases?.[type]?.label || type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Visual Route Timeline */}
                <div>
                    <h3 className={sectionTitleStyles}>
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                        {t('route')}
                    </h3>
                    <div className="relative pl-6 space-y-4">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-2 top-3 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        
                        {/* Pickup */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white dark:ring-slate-800"></div>
                            <label className={labelStyles}>{t('pickup_address')}</label>
                            <input type="text" name="pickupAddress" value={formData.pickupAddress || ''} onChange={handleChange} className={inputStyles} required placeholder="Airport, Hotel, or Address" />
                        </div>

                        {/* Stop (Optional) */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-yellow-400 ring-4 ring-white dark:ring-slate-800"></div>
                            <label className={labelStyles}>{t('stop_waypoint')} <span className="text-slate-400 font-normal normal-case">(Optional)</span></label>
                            <input type="text" name="stopAddress" value={formData.stopAddress || ''} onChange={handleChange} className={`${inputStyles} bg-slate-50/50 border-dashed`} placeholder="Via..." />
                        </div>

                        {/* Dropoff */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full bg-red-500 ring-4 ring-white dark:ring-slate-800"></div>
                            <label className={labelStyles}>{t('dropoff_address')}</label>
                            <input type="text" name="dropoffAddress" value={formData.dropoffAddress || ''} onChange={handleChange} className={inputStyles} required placeholder="Destination" />
                        </div>
                    </div>
                </div>

                {/* Basic Details */}
                <div>
                    <h3 className={sectionTitleStyles}>
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                        {t('details')}
                    </h3>
                    <div>
                        <label className={labelStyles}>{t('title')}</label>
                        <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className={inputStyles} required placeholder="e.g. Transfer: JFK -> Hotel" />
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: Client, Fulfillment, Finance */}
            <div className="space-y-8">
                
                {/* Client Card */}
                <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className={sectionTitleStyles}>
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        {t('client_info')}
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <input type="text" name="clientName" value={formData.clientName || ''} onChange={handleChange} className={`${inputStyles} bg-white dark:bg-slate-800`} placeholder={t('client_name')} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="email" name="clientEmail" value={formData.clientEmail || ''} onChange={handleChange} className={`${inputStyles} bg-white dark:bg-slate-800`} placeholder={t('client_email')} />
                            <input type="tel" name="clientPhone" value={formData.clientPhone || ''} onChange={handleChange} className={`${inputStyles} bg-white dark:bg-slate-800`} placeholder={t('client_phone')} />
                        </div>
                        
                        {/* Agency & Direct Toggle */}
                        <div className="pt-2 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isAgencyBooking} 
                                        onChange={handleAgencyToggle}
                                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('booked_by_agency')}</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isDirectBooking} 
                                        onChange={handleDirectBookingToggle}
                                        className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" 
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('direct_booking')}</span>
                                </label>
                            </div>
                            
                            {isAgencyBooking && (
                                <div className="w-full">
                                    <input 
                                        type="text" 
                                        name="agencyName" 
                                        value={formData.agencyName || ''} 
                                        onChange={handleChange} 
                                        list="agency-suggestions"
                                        className={`${inputStyles} bg-white dark:bg-slate-800 border-indigo-300 focus:border-indigo-500`} 
                                        placeholder={t('agency_name')}
                                    />
                                    <datalist id="agency-suggestions">
                                        {agencySuggestions.map((name, idx) => (
                                            <option key={idx} value={name} />
                                        ))}
                                    </datalist>
                                </div>
                            )}
                        </div>

                        {/* Passengers Counter */}
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-20">{t('passengers')}:</span>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden flex-1">
                                <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-600 flex-1 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 mr-2">{t('adults')}</span>
                                    <input type="number" name="passengersAdults" value={formData.passengersAdults ?? ''} onChange={handleNumberChange} className="w-10 p-0 border-none focus:ring-0 text-center text-sm bg-transparent" min="0" />
                                </div>
                                <div className="px-3 py-2 flex-1 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 mr-2">{t('kids')}</span>
                                    <input type="number" name="passengersKids" value={formData.passengersKids ?? ''} onChange={handleNumberChange} className="w-10 p-0 border-none focus:ring-0 text-center text-sm bg-transparent" min="0" />
                                </div>
                            </div>
                        </div>

                        {/* Luggage Counter */}
                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-20">{t('luggage')}:</span>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden flex-1">
                                <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-600 flex-1 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 mr-2">{t('luggage_big')}</span>
                                    <input type="number" name="passengersLuggageBig" value={formData.passengersLuggageBig ?? ''} onChange={handleNumberChange} className="w-10 p-0 border-none focus:ring-0 text-center text-sm bg-transparent" min="0" />
                                </div>
                                <div className="px-3 py-2 flex-1 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 mr-2">{t('luggage_small')}</span>
                                    <input type="number" name="passengersLuggageSmall" value={formData.passengersLuggageSmall ?? ''} onChange={handleNumberChange} className="w-10 p-0 border-none focus:ring-0 text-center text-sm bg-transparent" min="0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fulfillment */}
                <div>
                    <h3 className={sectionTitleStyles}>
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        {t('fulfillment')}
                    </h3>
                    {/* Segmented Pill Control */}
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex mb-4">
                        <button 
                            type="button" 
                            onClick={() => handleFulfillmentChange('INTERNAL')} 
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${fulfillmentType === 'INTERNAL' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t('in_house_driver')}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => handleFulfillmentChange('OUTSOURCED')} 
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${fulfillmentType === 'OUTSOURCED' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            {t('outsourced_supplier')}
                        </button>
                    </div>

                    {fulfillmentType === 'INTERNAL' ? (
                        <div className="space-y-3">
                            <select name="driverId" value={formData.driverId || ''} onChange={handleChange} className={inputStyles}>
                                <option value="">{t('unassigned_driver')}</option>
                                {sortedDrivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name} {driver.availability !== 'Available' ? `(${driver.availability})` : ''}
                                    </option>
                                ))}
                            </select>
                            
                            {/* Vehicle Assignment */}
                            <select name="vehicleId" value={formData.vehicleId || ''} onChange={handleChange} className={inputStyles}>
                                <option value="">{t('no_vehicle_assigned')}</option>
                                {activeVehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate})</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className={inputStyles}>
                            <option value="">{t('select_supplier_placeholder')}</option>
                            {validSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                </div>

                {/* Financials */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
                        <h3 className={sectionTitleStyles}>
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {t('financials_section')}
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelStyles}>{t('client_price')}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">{currencySymbol}</span>
                                    <input type="number" step="0.01" name="clientPrice" value={formData.clientPrice || ''} onChange={handleNumberChange} className={`${inputStyles} pl-7`} placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyles}>{t('payment_method')}</label>
                                <select name="paymentMethod" value={formData.paymentMethod || ''} onChange={handleChange} className={inputStyles}>
                                    <option value="">Not specified</option>
                                    {settings.paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="col-span-2">
                                <label className={labelStyles}>{t('deposit')}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">{currencySymbol}</span>
                                    <input type="number" step="0.01" name="deposit" value={formData.deposit || ''} onChange={handleNumberChange} className={`${inputStyles} pl-7`} placeholder="0.00" />
                                </div>
                            </div>

                            {/* Outsourced Cost Fields */}
                            {fulfillmentType === 'OUTSOURCED' && (
                                <>
                                    <div className="col-span-2 border-t border-dashed border-slate-200 dark:border-slate-700 my-2"></div>
                                    <div>
                                        <label className={labelStyles}>{t('supplier_cost')}</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400">{currencySymbol}</span>
                                            <input type="number" step="0.01" name="supplierCost" value={formData.supplierCost || ''} onChange={handleNumberChange} className={`${inputStyles} pl-7 border-red-200 focus:border-red-500 focus:ring-red-500`} placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyles}>{t('payment_status_out')}</label>
                                        <select name="supplierPaymentStatus" value={formData.supplierPaymentStatus || ''} onChange={handleChange} className={inputStyles}>
                                            <option value="">N/A</option>
                                            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Extras & Cross-Selling Section */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                {t('extras_cross_selling')}
                            </h4>
                            <p className="text-[10px] text-slate-400 mb-2">{t('extras_helper')}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <div className="relative">
                                        <span className="absolute left-2 top-2.5 text-slate-400 text-xs">{currencySymbol}</span>
                                        <input type="number" step="0.01" name="extrasAmount" value={formData.extrasAmount || ''} onChange={handleNumberChange} className={`${inputStyles} pl-5 text-xs`} placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <input type="text" name="extrasInfo" value={formData.extrasInfo || ''} onChange={handleChange} className={`${inputStyles} text-xs`} placeholder="Description (e.g. Guide Fee)" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Visual Calculator & Payment Flow Logic */}
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-slate-600 pb-2">{t('money_flow')}</h4>
                            
                            {/* Row 1: Client Price */}
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-slate-600 dark:text-slate-300">{t('client_price')}</span>
                                <span className="font-medium">{formData.clientPrice ? `${currencySymbol}${formData.clientPrice.toFixed(2)}` : `${currencySymbol}0.00`}</span>
                            </div>
                            
                            {/* Row 2: Deposit */}
                            <div className="flex justify-between items-center text-xs mb-1 text-slate-500">
                                <span>- {t('deposit')}</span>
                                <span>{formData.deposit ? `${currencySymbol}${formData.deposit.toFixed(2)}` : `${currencySymbol}0.00`}</span>
                            </div>

                            {/* Row 3: Balance to Collect */}
                            <div className="flex justify-between items-center text-xs mb-1 border-t border-dashed border-slate-300 pt-1">
                                <span className="text-slate-600 dark:text-slate-300 font-bold">{t('balance_to_collect')}</span>
                                <span className="font-bold">{balanceDue ? `${currencySymbol}${balanceDue.toFixed(2)}` : `${currencySymbol}0.00`}</span>
                            </div>

                            {/* Row 4: Extras */}
                            <div className="flex justify-between items-center text-xs mb-2 text-purple-600 dark:text-purple-400">
                                <span>+ {t('extras')}</span>
                                <span>{formData.extrasAmount ? `${currencySymbol}${formData.extrasAmount.toFixed(2)}` : `${currencySymbol}0.00`}</span>
                            </div>

                            {/* Total Cash Held */}
                            <div className="flex justify-between items-center text-xs mb-2 bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded text-yellow-800 dark:text-yellow-200">
                                <span className="font-bold">{t('total_cash_held')}</span>
                                <span className="font-bold">{currencySymbol}{cashHeldByExecutor.toFixed(2)}</span>
                            </div>
                            
                            {fulfillmentType === 'OUTSOURCED' && (
                                <div className="flex justify-between items-center text-xs mb-1 text-red-600 dark:text-red-400 border-t border-slate-200 pt-2">
                                    <span>{t('supplier_cost')}</span>
                                    <span>{formData.supplierCost ? `${currencySymbol}${formData.supplierCost.toFixed(2)}` : `${currencySymbol}0.00`}</span>
                                </div>
                            )}
                            
                            {/* Row 5: Total Profit */}
                            <div className="flex justify-between items-center border-t border-dashed border-slate-300 dark:border-slate-500 pt-2 mb-4 mt-2">
                                <span className="font-bold uppercase text-xs text-slate-800 dark:text-slate-200">{t('company_profit')}</span>
                                <span className={`font-black text-lg ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                                    {currencySymbol}{totalProfit.toFixed(2)}
                                </span>
                            </div>

                            {/* Row 6: Settlement Instructions */}
                            <div className={`p-3 rounded border text-xs ${settlementDetails.color.replace('text-', 'bg-').replace('600', '50').replace('400', '900/20').replace('dark:text-', 'dark:bg-')} ${settlementDetails.color.replace('text-', 'border-').replace('600', '200').replace('400', '800')}`}>
                                <p className={`font-bold ${settlementDetails.color}`}>
                                    {settlementDetails.text}
                                </p>
                                {settlementDetails.subtext && (
                                    <p className="mt-1 opacity-80 text-[10px]">
                                        {settlementDetails.subtext}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Area: Notes & Color & Description */}
            <div className="lg:col-span-2 space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div>
                    <label className={labelStyles}>{t('notes')}</label>
                    <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className={inputStyles} placeholder="Driver notes, special requests..." />
                </div>
                
                <div>
                    <label className={labelStyles}>{t('calendar_color')}</label>
                    <select 
                        name="color"
                        value={formData.color || 'Default'}
                        onChange={handleChange}
                        className={inputStyles}
                        style={{
                            borderLeft: `5px solid ${EVENT_COLORS[formData.color || 'Default']?.match(/bg-([a-z]+)-/)?.[1] || 'blue'}`
                        }}
                    >
                        {Object.keys(EVENT_COLORS).map(colorKey => (
                            <option key={colorKey} value={colorKey}>
                                {colorKey}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Original Description Field - Bottom of page */}
                <div>
                    <label className={labelStyles}>{t('original_description')}</label>
                    <textarea 
                        name="description" 
                        value={formData.description || ''} 
                        onChange={handleChange} 
                        rows={3} 
                        className={`${inputStyles} text-xs font-mono bg-slate-100 dark:bg-slate-800`} 
                        placeholder="Original raw text from email or AI extraction..." 
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:col-span-2 flex items-center gap-3 pt-4">
                {onDelete && service?.id && (
                    <button 
                        type="button" 
                        onClick={handleDelete}
                        className="flex items-center px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors mr-auto"
                        title={t('delete')}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        {t('delete')}
                    </button>
                )}
                
                {!onDelete && service?.id && <div className="mr-auto"></div>} 
                
                {error && <span className="text-red-600 dark:text-red-400 text-sm font-medium mr-2">{error}</span>}
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 border border-transparent rounded-lg shadow hover:bg-primary-700 transition-colors">{t('save')}</button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
