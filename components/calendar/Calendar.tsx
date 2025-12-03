
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Service, FilterCriteria, SavedFilter, User, Supplier, ServiceType, ServiceStatus, AppSettings, DriverLeave, Vehicle } from '../../types';
import { useCalendar, CalendarView } from '../../hooks/useCalendar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { useTranslation } from '../../hooks/useTranslation';

interface CalendarProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  onTimeSlotClick: (startTime: Date) => void;
  drivers: User[];
  suppliers: Supplier[];
  vehicles: Vehicle[];
  savedFilters: SavedFilter[];
  onSaveFilter: (filter: SavedFilter) => void;
  onDeleteFilter: (filterId: string) => void;
  settings: AppSettings;
  driverLeaves?: DriverLeave[];
  userRole: 'ADMIN' | 'DRIVER' | 'PARTNER';
  onUpdateService: (service: Service) => void;
  onAddService?: () => void;
}

const FilterCheckbox: React.FC<{id: string, label: string, isChecked: boolean, onChange: () => void}> = ({id, label, isChecked, onChange}) => (
    <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-md">
        <input id={id} type="checkbox" checked={isChecked} onChange={onChange} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);

const SearchResultsList: React.FC<{ results: Service[], onSelect: (s: Service) => void, onClose: () => void }> = ({ results, onSelect, onClose }) => {
    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <p className="text-lg font-medium">No services found</p>
                <p className="text-sm">Try adjusting your search terms.</p>
                <button onClick={onClose} className="mt-4 text-primary-600 hover:underline text-sm">Clear Search</button>
            </div>
        )
    }
    
    // Sort by date
    const sorted = [...results].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">Search Results ({results.length})</h3>
                    <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        Close Search
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {sorted.map(service => (
                        <div 
                            key={service.id}
                            onClick={() => onSelect(service)}
                            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-all flex flex-col sm:flex-row gap-4 group"
                        >
                            <div className="flex-shrink-0 w-full sm:w-24 text-center flex flex-row sm:flex-col justify-between sm:justify-center items-center border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-700 pb-2 sm:pb-0 sm:pr-4 gap-2">
                                 <span className="text-xs font-bold text-slate-500 uppercase">{service.startTime.toLocaleString('default', { month: 'short' })}</span>
                                 <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{service.startTime.getDate()}</span>
                                 <span className="text-xs text-slate-400">{service.startTime.getFullYear()}</span>
                                 <span className="sm:hidden text-sm font-mono text-slate-600 dark:text-slate-300">{service.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{service.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                                        service.status === ServiceStatus.COMPLETED ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                        service.status === ServiceStatus.CANCELLED ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}>
                                        {service.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium hidden sm:block">
                                    {service.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - <span className="text-slate-800 dark:text-slate-100 font-bold">{service.clientName}</span>
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-100 mt-1 font-bold sm:hidden block">
                                    {service.clientName}
                                </p>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex flex-col sm:flex-row gap-2 sm:gap-6">
                                    <span className="flex items-center truncate max-w-xs">
                                        <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        {service.pickupAddress}
                                    </span>
                                    <span className="flex items-center truncate max-w-xs">
                                        <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {service.dropoffAddress}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export const Calendar: React.FC<CalendarProps> = ({ 
    services, 
    onSelectService,
    onTimeSlotClick,
    drivers,
    suppliers,
    vehicles = [],
    savedFilters,
    onSaveFilter,
    onDeleteFilter,
    settings,
    driverLeaves = [],
    userRole,
    onUpdateService,
    onAddService
}) => {
  const { 
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    weeks, 
    weekDays,
    headerTitle,
    goToNext, 
    goToPrevious, 
    goToToday,
    view,
    setView
  } = useCalendar(new Date(), settings.language);

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>({});
  const [newFilterName, setNewFilterName] = useState('');
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [zoomLevel, setZoomLevel] = useState(settings.compactMode ? 2 : 3); 
  const { t } = useTranslation(settings.language);

  const isAdmin = userRole === 'ADMIN';

  // Generate localized weekdays
  const weekdays = useMemo(() => {
      const days = [];
      const d = new Date();
      // Find next Sunday to start
      d.setDate(d.getDate() - d.getDay()); 
      
      const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      const locale = localeMap[settings.language] || 'en-US';

      for(let i=0; i<7; i++) {
          days.push(d.toLocaleString(locale, { weekday: 'short' }));
          d.setDate(d.getDate() + 1);
      }
      return days;
  }, [settings.language]);

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count: number, arr) => count + ((arr as any[])?.length || 0), 0);
  }, [activeFilters]);
  
  // Inject driver leaves AND Vehicle Reminders as pseudo-services (Small slots in morning)
  const servicesWithExtras = useMemo(() => {
    const leavesAsServices = driverLeaves.map(leave => {
        const driver = drivers.find(d => d.id === leave.driverId);
        const driverName = driver?.name || 'Driver';
        
        // 5:00 AM - 5:15 AM
        const start = new Date(leave.date);
        start.setHours(5, 0, 0, 0);
        const end = new Date(leave.date);
        end.setHours(5, 15, 0, 0);

        return {
            id: `leave-${leave.id}`,
            title: `🚫 LEAVE: ${driverName}`, // Detailed title
            clientName: `${driverName} is OFF`, // Displayed in Week/Day view if big enough
            pickupAddress: '',
            dropoffAddress: '',
            startTime: start,
            endTime: end,
            status: ServiceStatus.CONFIRMED,
            serviceType: ServiceType.CUSTOM, 
            createdById: 'system',
            color: 'Black', 
            driverId: leave.driverId,
            isLeave: true
        } as any as Service; 
    });

    const vehicleReminders = vehicles.flatMap(v => {
        const reminders = [];
        const vehLabel = `${v.make} ${v.model} (${v.plate})`;

        if (v.insuranceExpiry) {
            // 5:15 AM - 5:30 AM
            const start = new Date(v.insuranceExpiry);
            start.setHours(5, 15, 0, 0);
            const end = new Date(v.insuranceExpiry);
            end.setHours(5, 30, 0, 0);
            reminders.push({
                id: `veh-ins-${v.id}`,
                title: `⚠️ INSURANCE EXPIRY: ${vehLabel}`, 
                clientName: `Insurance Due: ${vehLabel}`,
                startTime: start,
                endTime: end,
                status: ServiceStatus.CONFIRMED,
                serviceType: ServiceType.CUSTOM,
                createdById: 'system',
                color: 'Red',
                isLeave: true 
            } as any as Service);
        }
        if (v.maintenanceDate) {
            // 5:30 AM - 5:45 AM
            const start = new Date(v.maintenanceDate);
            start.setHours(5, 30, 0, 0);
            const end = new Date(v.maintenanceDate);
            end.setHours(5, 45, 0, 0);
            reminders.push({
                id: `veh-maint-${v.id}`,
                title: `🔧 MAINTENANCE DUE: ${vehLabel}`, 
                clientName: `Service Due: ${vehLabel}`,
                startTime: start,
                endTime: end,
                status: ServiceStatus.CONFIRMED,
                serviceType: ServiceType.CUSTOM,
                createdById: 'system',
                color: 'Orange',
                isLeave: true
            } as any as Service);
        }
        return reminders;
    });

    return [...services, ...leavesAsServices, ...vehicleReminders];
  }, [services, driverLeaves, drivers, vehicles]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    let result = servicesWithExtras;

    // 1. Text Search
    if (query) {
        result = result.filter(service => {
            return (
                (service.title || '').toLowerCase().includes(query) ||
                (service.clientName || '').toLowerCase().includes(query) ||
                (service.pickupAddress || '').toLowerCase().includes(query) ||
                (service.dropoffAddress || '').toLowerCase().includes(query) ||
                (service.flightNumber || '').toLowerCase().includes(query) ||
                (service.notes || '').toLowerCase().includes(query) ||
                (service.clientEmail || '').toLowerCase().includes(query) ||
                (service.clientPhone || '').toLowerCase().includes(query)
            );
        });
    }

    // 2. Filters
    if (Object.values(activeFilters).some(val => val && (val as any[]).length > 0)) {
        result = result.filter(service => {
            const { serviceType, status, driverId } = activeFilters;
            if ((service as any).isLeave) {
                 if (driverId?.length && service.driverId && !driverId.includes(service.driverId)) return false;
                 if (driverId?.length && !service.driverId) return false;
                 return true;
            }

            if (serviceType?.length && !serviceType.includes(service.serviceType)) return false;
            if (status?.length && !status.includes(service.status)) return false;
            if (driverId?.length && (!service.driverId || !driverId.includes(service.driverId))) return false;
            return true;
          });
    }
    
    return result;
  }, [servicesWithExtras, activeFilters, searchQuery]);

  useEffect(() => {
      if (isSearchExpanded && searchInputRef.current) {
          searchInputRef.current.focus();
      }
  }, [isSearchExpanded]);

  const handleSearchToggle = () => {
      setIsSearchExpanded(!isSearchExpanded);
      if (isSearchExpanded && !searchQuery) setSearchQuery('');
  };

  const handleFilterChange = (category: keyof FilterCriteria, value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      const updatedFilters = { ...prev, [category]: newValues };
      if (newValues.length === 0) delete updatedFilters[category];
      return updatedFilters;
    });
  };

  const handleLoadFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filterId = e.target.value;
    setSelectedSavedFilterId(filterId);
    if (filterId) {
        const filterToLoad = savedFilters.find(f => f.id === filterId);
        if (filterToLoad) setActiveFilters(filterToLoad.criteria);
    } else {
        setActiveFilters({});
    }
  };

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) { alert('Please enter a name.'); return; }
    if (Object.keys(activeFilters).length === 0) { alert('Cannot save empty filter.'); return; }
    const newFilter = { id: `filter-${Date.now()}`, name: newFilterName, criteria: activeFilters };
    onSaveFilter(newFilter);
    setNewFilterName('');
    setSelectedSavedFilterId(newFilter.id);
  };

  const handleDeleteFilter = () => {
      if (!selectedSavedFilterId) {
          alert("Please select a saved filter to delete.");
          return;
      }
      if (window.confirm(`Delete filter?`)) {
          onDeleteFilter(selectedSavedFilterId);
          setSelectedSavedFilterId('');
          setActiveFilters({});
      }
  };
  
  const handleDayDoubleClick = (date: Date) => {
    setView('day');
    setCurrentDate(date);
    setSelectedDate(date);
  };
  
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleServiceClick = (service: Service) => {
      if ((service as any).isLeave) { return; }
      onSelectService(service);
  }

  const handleMoveService = (serviceId: string, newDate: Date) => {
      const service = services.find(s => s.id === serviceId);
      if (service && isAdmin) {
          const originalStart = new Date(service.startTime);
          let newStart = new Date(newDate);
          
          if (newStart.getHours() === 0 && newStart.getMinutes() === 0 && view === 'month') {
              newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
          }
          
          const duration = service.endTime 
             ? service.endTime.getTime() - originalStart.getTime() 
             : 60 * 60 * 1000; 
          
          const newEnd = new Date(newStart.getTime() + duration);
          
          onUpdateService({
              ...service,
              startTime: newStart,
              endTime: newEnd
          });
      }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header: Clean Light/Dark Theme Bar */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex-nowrap shadow-sm z-20">
        
        {/* Left Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Today Button */}
          <button onClick={goToToday} title={t('today')} className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center">
             {t('today')}
          </button>

          <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <button onClick={goToPrevious} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-r border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button onClick={goToNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          
          <h2 className="ml-2 text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap capitalize flex-shrink-0">
            {headerTitle}
          </h2>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 ml-auto flex-shrink-0">
            {/* Search */}
            <div className={`flex items-center transition-all duration-300 ease-in-out ${isSearchExpanded || searchQuery ? 'w-32 sm:w-64' : 'w-8'}`}>
                {isSearchExpanded || searchQuery ? (
                    <div className="relative w-full">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full py-1.5 px-3 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500"
                        />
                        <button onClick={() => { setSearchQuery(''); setIsSearchExpanded(false); }} className="absolute right-1 top-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleSearchToggle}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        title="Search"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                )}
            </div>

            {/* Filter Button */}
           <button 
                onClick={() => setShowFilters(prev => !prev)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border ${showFilters ? 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600' : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                title={t('filters')}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 01 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                <span className="text-sm font-medium">{t('filters')}</span>
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-primary-500 ring-2 ring-white dark:ring-slate-900"></span>
                )}
            </button>

            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0"></div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-0.5 flex-shrink-0">
                {['month', 'week', 'day'].map((v) => (
                    <button 
                        key={v}
                        onClick={() => setView(v as CalendarView)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === v ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'}`}
                    >
                        {t(v as any)}
                    </button>
                ))}
            </div>
            
            {isAdmin && onAddService && (
              <button
                  onClick={onAddService}
                  className="ml-2 hidden md:flex items-center justify-center w-8 h-8 bg-primary-600 rounded-full hover:bg-primary-500 text-white shadow-sm transition-colors"
                  title={t('create_service')}
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            )}
        </div>
      </div>
      
      {showFilters && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-fade-in-down">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Filter Services</h3>
                <button onClick={() => setActiveFilters({})} className="text-sm font-medium text-primary-600 hover:underline">{t('clear_filters')}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2 text-slate-600 dark:text-slate-300">{t('by_service_type')}</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {Object.values(ServiceType).map(type => (
                            <FilterCheckbox 
                                key={type} 
                                id={`type-${type}`} 
                                label={t(`type_${type}` as any) || type.replace(/_/g, ' ')} 
                                isChecked={activeFilters.serviceType?.includes(type) || false} 
                                onChange={() => handleFilterChange('serviceType', type)} 
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-slate-600 dark:text-slate-300">{t('by_driver')}</h4>
                     <div className="space-y-1 max-h-32 overflow-y-auto">
                        {drivers.map(driver => (
                            <FilterCheckbox key={driver.id} id={`driver-${driver.id}`} label={driver.name} isChecked={activeFilters.driverId?.includes(driver.id) || false} onChange={() => handleFilterChange('driverId', driver.id)} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('saved_filters')}</h3>
                 <div className="flex items-center gap-2 flex-wrap">
                    <select value={selectedSavedFilterId} onChange={handleLoadFilter} className="bg-slate-50 text-slate-900 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500">
                        <option value="">{t('load_filter')}</option>
                        {savedFilters.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {isAdmin && (
                        <>
                            <input type="text" value={newFilterName} onChange={e => setNewFilterName(e.target.value)} placeholder={t('new_filter_name')} className="bg-slate-50 text-slate-900 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500" />
                            <button onClick={handleSaveFilter} className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">{t('save_current')}</button>
                            <button onClick={handleDeleteFilter} className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">{t('delete_selected')}</button>
                        </>
                    )}
                 </div>
            </div>
        </div>
      )}

      {searchQuery.trim().length > 0 ? (
          <SearchResultsList results={filteredServices} onSelect={handleServiceClick} onClose={() => setSearchQuery('')} />
      ) : (
          <>
            {view === 'month' && (
                <>
                    {/* Weekday Header - Adjusted for Light/Dark */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-slate-500 dark:text-slate-400 text-xs uppercase sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                        {weekdays.map(day => (
                        <div key={day} className="py-2">{day}</div>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto">
                        <MonthView 
                        weeks={weeks} 
                        services={filteredServices} 
                        currentMonth={currentDate.getMonth()}
                        selectedDate={selectedDate}
                        onSelectService={handleServiceClick} 
                        onDaySelect={handleDaySelect}
                        onDayDoubleClick={handleDayDoubleClick}
                        zoomLevel={zoomLevel}
                        drivers={drivers}
                        onTimeSlotClick={isAdmin ? onTimeSlotClick : () => {}}
                        onMoveService={handleMoveService}
                        settings={settings}
                        />
                    </div>
                </>
            )}
            {view === 'week' && (
                <div className="flex-1 overflow-auto">
                    <WeekView
                        days={weekDays}
                        services={filteredServices}
                        selectedDate={selectedDate}
                        onSelectService={handleServiceClick}
                        onDaySelect={handleDaySelect}
                        onDayDoubleClick={handleDayDoubleClick}
                        onTimeSlotClick={isAdmin ? onTimeSlotClick : () => {}}
                        onMoveService={handleMoveService}
                        zoomLevel={zoomLevel}
                        drivers={drivers}
                        settings={settings}
                    />
                </div>
            )}
            {view === 'day' && (
                <div className="flex-1 overflow-auto">
                    <DayView
                        day={currentDate}
                        services={filteredServices}
                        onSelectService={handleServiceClick}
                        onTimeSlotClick={isAdmin ? onTimeSlotClick : () => {}}
                        onMoveService={handleMoveService}
                        drivers={drivers}
                        zoomLevel={zoomLevel}
                        settings={settings}
                    />
                </div>
            )}
          </>
      )}
    </div>
  );
};
