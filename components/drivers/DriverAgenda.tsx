
import React, { useState, useMemo } from 'react';
import { Service, User, AppSettings, Vehicle, VehicleAssignment } from '../../types';
import { formatTime } from '../../lib/calendar-utils';
import { useTranslation } from '../../hooks/useTranslation';

interface DriverAgendaProps {
  drivers: User[];
  services: Service[];
  settings: AppSettings;
  vehicles: Vehicle[];
  assignments: VehicleAssignment[];
}

export const DriverAgenda: React.FC<DriverAgendaProps> = ({ drivers, services, settings, vehicles, assignments }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const { t } = useTranslation(settings.language);

  const getLocale = () => {
      const map: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      return map[settings.language] || 'en-US';
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: settings.currency }).format(amount);
  };

  const dailyServices = useMemo(() => {
    if (!selectedDriverId || !selectedDate) return [];
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return services.filter(s => {
        return s.driverId === selectedDriverId && 
               s.startTime >= startOfDay && 
               s.startTime <= endOfDay;
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [selectedDriverId, selectedDate, services]);

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  // Helper to find vehicle for a specific service
  // Priority: 1. Specific Service Override 2. Daily Assignment
  const getVehicleForService = (service: Service): Vehicle | undefined => {
      if (service.vehicleId) {
          return vehicles.find(v => v.id === service.vehicleId);
      }
      // Check daily assignment
      const serviceDateStr = new Date(service.startTime).toDateString();
      const assignment = assignments.find(a => 
          a.driverId === service.driverId && 
          new Date(a.date).toDateString() === serviceDateStr
      );
      if (assignment) {
          return vehicles.find(v => v.id === assignment.vehicleId);
      }
      return undefined;
  };

  // Helper to calculate what the driver needs to physically collect
  const getCollectionDetails = (s: Service) => {
    const price = s.clientPrice || 0;
    const deposit = s.deposit || 0;
    const balance = Math.max(0, price - deposit);
    const method = (s.paymentMethod || '').toLowerCase();

    // Logic: Cash, Card (on site), Balance+Deposit -> COLLECT
    if (
        method.includes('cash') || 
        method.includes('pay to') || 
        method.includes('card') // Includes "Credit Card" (on site terminal)
    ) {
        if (!method.includes('prepaid') && !method.includes('invoice')) {
             return { amount: balance, label: method.includes('card') ? 'COLLECT CARD' : 'FULL AMOUNT' };
        }
    }
    
    // Deposit + Balance explicitly
    if (method.includes('deposit') && method.includes('balance')) {
        if (balance > 0) return { amount: balance, label: 'BALANCE DUE' };
    }

    // Fallback - if status is UNPAID and not invoiced/prepaid, assume collection
    if (s.clientPaymentStatus === 'UNPAID' && balance > 0) {
        if (!method.includes('invoice') && !method.includes('prepaid')) {
             return { amount: balance, label: 'COLLECT' };
        }
    }

    return null;
  };

  const generateShareableText = () => {
    if (!selectedDriver) return;
    
    const locale = getLocale();
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
    
    let text = `DRIVER AGENDA - ${dateStr.toUpperCase()}\n`;
    text += `Driver: ${selectedDriver.name}\n`;
    text += `--------------------------------------------------\n`;

    if (dailyServices.length === 0) {
        text += `No services scheduled.\n`;
    } else {
        dailyServices.forEach((s, index) => {
            const startTime = formatTime(s.startTime, settings.timeFormat);
            const collection = getCollectionDetails(s);
            const pax = `${s.passengersAdults || s.numberOfPassengers || 1} Adl${s.passengersKids ? ` + ${s.passengersKids} Chd` : ''}`;
            const vehicle = getVehicleForService(s);

            text += `\nJOB #${index + 1} | ${startTime}`;
            if (s.flightNumber) text += ` | ${s.flightNumber}`;
            text += `\n`;
            
            if (vehicle) {
                text += `Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.plate})\n`;
            }

            text += `FROM: ${s.pickupAddress}\n`;
            if (s.stopAddress) text += `VIA:  ${s.stopAddress}\n`;
            text += `TO:   ${s.dropoffAddress}\n`;
            
            text += `Client: ${s.clientName} (${pax})\n`;
            if (s.clientPhone) text += `Phone: ${s.clientPhone}\n`;
            
            if (s.notes) text += `NOTE: ${s.notes}\n`;

            if (collection) {
                 text += `\nACTION: COLLECT ${formatCurrency(collection.amount)} (${collection.label})\n`;
            } else {
                 text += `Payment: ${s.paymentMethod || 'Prepaid/Account'}\n`;
            }
            text += `--------------------------------------------------\n`;
        });
    }

    navigator.clipboard.writeText(text);
    alert("Agenda copied to clipboard!");
  };

  const handlePrint = () => {
    if (!selectedDriver) return;
    const locale = getLocale();
    const dateStr = new Date(selectedDate).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const servicesHtml = dailyServices.map((s, index) => {
        const collection = getCollectionDetails(s);
        const pax = `${s.passengersAdults || s.numberOfPassengers || 1} Adults${s.passengersKids ? `, ${s.passengersKids} Kids` : ''}`;
        const vehicle = getVehicleForService(s);
        
        return `
        <div class="service-row">
            <div class="time-box">
                <div class="time">${formatTime(s.startTime, settings.timeFormat)}</div>
                <div class="service-id">#${index + 1}</div>
            </div>
            <div class="details-box">
                ${vehicle ? `<div class="vehicle-badge">Vehicle: <strong>${vehicle.make} ${vehicle.model}</strong> <span style="font-family:monospace">(${vehicle.plate})</span></div>` : ''}
                <div class="route-line">
                    <span class="badge">${t('manifest_pickup')}</span> <strong>${s.pickupAddress}</strong>
                </div>
                ${s.stopAddress ? `
                <div class="route-line">
                    <span class="badge stop">${t('manifest_stop')}</span> ${s.stopAddress}
                </div>` : ''}
                <div class="route-line">
                    <span class="badge drop">${t('manifest_dropoff')}</span> <strong>${s.dropoffAddress}</strong>
                </div>
                
                <div class="meta-info">
                    <div><strong>${t('share_client')}:</strong> ${s.clientName}</div>
                    <div><strong>${t('manifest_pax')}:</strong> ${pax}</div>
                    ${s.flightNumber ? `<div><strong>${t('flight_number')}:</strong> ${s.flightNumber}</div>` : ''}
                    ${s.clientPhone ? `<div><strong>${t('client_phone')}:</strong> ${s.clientPhone}</div>` : ''}
                </div>
                
                ${s.notes ? `<div class="notes"><strong>${t('manifest_note')}:</strong> ${s.notes}</div>` : ''}
            </div>
            <div class="payment-box ${collection ? 'alert' : ''}">
                ${collection ? `
                    <div class="collect-title">${t('manifest_collect')}</div>
                    <div class="collect-amount">${formatCurrency(collection.amount)}</div>
                    <div class="collect-method">${collection.label}</div>
                ` : `
                    <div class="paid-title">${t('payment_method')}</div>
                    <div class="paid-status">${s.paymentMethod || 'PREPAID'}</div>
                    <div class="paid-check">OK</div>
                `}
            </div>
        </div>
        `;
    }).join('');

    const companyInfo = `
        <div style="font-size: 14px; margin-top: 5px;">
            <div style="font-weight:bold;">${settings.companyName}</div>
            ${settings.companyAddress ? `<div>${settings.companyAddress}</div>` : ''}
            <div>
                ${settings.companyPhone ? `<span>Tel: ${settings.companyPhone}</span>` : ''}
                ${settings.companyEmail ? `<span style="margin-left: 15px;">Email: ${settings.companyEmail}</span>` : ''}
            </div>
            ${settings.companyWebsite ? `<div>${settings.companyWebsite}</div>` : ''}
        </div>
    `;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${t('manifest_title')} - ${selectedDriver.name}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 20px; max-width: 1000px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; align-items: flex-start; }
                .title h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; color: #000; }
                .meta { text-align: right; }
                .meta div { font-size: 14px; font-weight: bold; }
                
                .service-row { display: flex; border: 1px solid #ccc; margin-bottom: 15px; page-break-inside: avoid; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                
                .time-box { background: #f1f5f9; width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid #ccc; padding: 10px; }
                .time { font-size: 22px; font-weight: 800; color: #1e293b; }
                .service-id { background: #333; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-top: 5px; }
                
                .details-box { flex: 1; padding: 15px; }
                .vehicle-badge { display: inline-block; font-size: 11px; background: #e2e8f0; padding: 3px 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #cbd5e1; }
                .route-line { margin-bottom: 8px; font-size: 14px; }
                .badge { display: inline-block; font-size: 10px; font-weight: bold; color: #fff; background: #16a34a; padding: 2px 6px; border-radius: 3px; width: 50px; text-align: center; margin-right: 8px; }
                .badge.drop { background: #dc2626; }
                .badge.stop { background: #ca8a04; }
                
                .meta-info { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0; font-size: 13px; color: #475569; }
                
                .notes { margin-top: 12px; background: #fff7ed; border-left: 4px solid #f97316; padding: 8px; font-size: 13px; font-style: italic; }
                
                .payment-box { width: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #ccc; padding: 10px; text-align: center; background: #f8fafc; }
                .payment-box.alert { background: #fef2f2; border-left: 4px solid #dc2626; }
                
                .collect-title { font-size: 10px; font-weight: 900; color: #dc2626; text-transform: uppercase; }
                .collect-amount { font-size: 20px; font-weight: 900; color: #dc2626; margin: 5px 0; }
                .collect-method { font-size: 10px; font-weight: bold; color: #7f1d1d; }
                
                .paid-title { font-size: 10px; font-weight: 700; color: #64748b; }
                .paid-status { font-size: 12px; font-weight: 600; margin: 5px 0; color: #334155; }
                .paid-check { font-size: 18px; color: #16a34a; font-weight: bold; }

                @media print {
                    body { padding: 0; }
                    .service-row { border: 1px solid #000; }
                    .time-box { background: #eee !important; border-right: 1px solid #000; -webkit-print-color-adjust: exact; }
                    .payment-box { border-left: 1px solid #000; -webkit-print-color-adjust: exact; }
                    .payment-box.alert { background: #ffecec !important; border-left: 4px solid #000 !important; -webkit-print-color-adjust: exact; }
                    .badge { color: #000 !important; border: 1px solid #000; background: #fff !important; -webkit-print-color-adjust: exact; }
                    .vehicle-badge { border: 1px solid #999; background: #eee !important; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">
                    <h1>${settings.companyName}</h1>
                    ${companyInfo}
                </div>
                <div class="meta">
                    <div style="font-size: 20px; margin-bottom: 5px;">${t('manifest_title')}</div>
                    <div>${t('driver').toUpperCase()}: ${selectedDriver.name}</div>
                    <div>${t('manifest_date')}: ${dateStr.toUpperCase()}</div>
                    <div>${t('manifest_jobs')}: ${dailyServices.length}</div>
                </div>
            </div>
            ${servicesHtml}
            ${dailyServices.length === 0 ? `<div style="text-align:center; padding:40px; color:#777;">${t('manifest_no_jobs')}</div>` : ''}
            <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in-down">
        {/* Control Bar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-end shadow-sm">
            <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('driver')}</label>
                <select
                    value={selectedDriverId}
                    onChange={e => setSelectedDriverId(e.target.value)}
                    className="block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 py-2.5 pl-3"
                >
                    <option value="">-- Select --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('date')}</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="block w-full bg-slate-50 text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 py-2.5"
                />
            </div>
            <div className="flex-1 flex justify-end space-x-3 pb-0.5">
                <button 
                    onClick={generateShareableText}
                    disabled={!selectedDriverId}
                    className="flex items-center px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                    <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    Copy Agenda
                </button>
                <button 
                    onClick={handlePrint}
                    disabled={!selectedDriverId}
                    className="flex items-center px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print Manifest
                </button>
            </div>
        </div>

        {selectedDriverId && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="bg-slate-100 dark:bg-slate-900 p-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <div>
                         <h3 className="text-lg font-bold tracking-wide uppercase text-slate-800 dark:text-slate-100">
                            {new Date(selectedDate).toLocaleDateString(getLocale(), { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {t('driver')}: {selectedDriver?.name}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-black text-slate-800 dark:text-slate-100">{dailyServices.length}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase">{t('manifest_jobs')}</span>
                    </div>
                </div>
                
                <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50 min-h-[400px]">
                    {dailyServices.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            <p className="text-slate-500 font-bold uppercase tracking-wide">{t('manifest_no_jobs')}</p>
                         </div>
                    ) : (
                        dailyServices.map((service, index) => {
                            const collection = getCollectionDetails(service);
                            const vehicle = getVehicleForService(service);
                            
                            return (
                                <div key={service.id} className="flex flex-col md:flex-row bg-white dark:bg-slate-800 border-l-4 border-slate-800 dark:border-slate-500 shadow-sm rounded-r-lg overflow-hidden">
                                    
                                    <div className="md:w-24 p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                                        <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                                            {formatTime(service.startTime, settings.timeFormat)}
                                        </span>
                                    </div>

                                    <div className="flex-1 p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 uppercase">
                                                {service.title}
                                            </h4>
                                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                                Job #{index + 1}
                                            </span>
                                        </div>
                                        
                                        {vehicle && (
                                            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 w-fit">
                                                <svg className="w-3 h-3 mr-1.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                <strong>{vehicle.make} {vehicle.model}</strong>
                                                <span className="ml-1 font-mono opacity-75">({vehicle.plate})</span>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                                <div className="flex">
                                                    <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">From:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{service.pickupAddress}</span>
                                                </div>
                                                {service.stopAddress && (
                                                     <div className="flex">
                                                        <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">Stop:</span>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100 italic">{service.stopAddress}</span>
                                                    </div>
                                                )}
                                                <div className="flex">
                                                    <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">To:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{service.dropoffAddress}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                 <div className="flex">
                                                    <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">Client:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{service.clientName}</span>
                                                </div>
                                                 <div className="flex">
                                                    <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">Pax:</span>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {service.passengersAdults || (service.numberOfPassengers || 1)} Adl, {service.passengersKids || 0} Chd
                                                    </span>
                                                </div>
                                                {service.flightNumber && (
                                                    <div className="flex">
                                                        <span className="w-20 font-bold text-slate-500 text-xs uppercase pt-0.5">Flight:</span>
                                                        <span className="font-bold text-slate-900 dark:text-slate-100">{service.flightNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {service.notes && (
                                            <div className="mt-1 bg-amber-50 dark:bg-amber-900/20 p-2 text-xs font-medium text-amber-800 dark:text-amber-200 border-l-2 border-amber-400">
                                                <span className="font-bold uppercase mr-1">NOTE:</span> {service.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Collection Action Box */}
                                    {collection ? (
                                        <div className="md:w-40 bg-red-50 dark:bg-red-900/20 border-t md:border-t-0 md:border-l border-red-100 dark:border-red-900/30 p-4 flex flex-col justify-center items-center text-center">
                                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase mb-1 animate-pulse">Collect</span>
                                            <span className="text-xl font-black text-red-700 dark:text-red-300">{formatCurrency(collection.amount)}</span>
                                            <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 py-0.5 mt-1 uppercase rounded">{collection.label}</span>
                                        </div>
                                    ) : (
                                         <div className="hidden md:flex md:w-20 items-center justify-center border-l border-slate-100 dark:border-slate-700 flex-col">
                                            <span className="text-slate-300 dark:text-slate-600 font-bold text-xl">✓</span>
                                            <span className="text-[9px] text-slate-400 uppercase font-bold mt-1">Paid</span>
                                         </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}
    </div>
  );
};