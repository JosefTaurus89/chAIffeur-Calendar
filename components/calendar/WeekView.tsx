import React, { useMemo, useEffect, useRef } from 'react';
import { Service, User, AppSettings } from '../../types';
import { getHours, isSameDay, isToday } from '../../lib/calendar-utils';
import { TimeSlotItem } from './TimeSlotItem';
import { calculateEventPositions } from '../../lib/layout-utils';

interface WeekViewProps {
  days: Date[];
  services: Service[];
  selectedDate: Date;
  onSelectService: (service: Service) => void;
  onDaySelect: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  onTimeSlotClick: (startTime: Date) => void;
  onMoveService: (serviceId: string, newDate: Date) => void;
  drivers: User[];
  zoomLevel: number;
  settings: AppSettings;
}

const DayColumn: React.FC<{
  day: Date;
  services: Service[];
  isSelected: boolean;
  onSelectService: (service: Service) => void;
  onTimeSlotClick: (startTime: Date) => void;
  onMoveService: (serviceId: string, newDate: Date) => void;
  timeSlotHeight: number;
  drivers: User[];
  startHour: number;
  endHour: number;
  timeFormat: '12h' | '24h';
}> = ({ day, services, isSelected, onSelectService, onTimeSlotClick, onMoveService, timeSlotHeight, drivers, startHour, endHour, timeFormat }) => {
  // Filter and layout
  const servicesForDay = useMemo(() => {
      return services.filter(service => isSameDay(new Date(service.startTime), day));
  }, [services, day]);

  const layoutPositions = useMemo(() => {
      return calculateEventPositions(servicesForDay);
  }, [servicesForDay]);

  const hours = getHours(startHour, endHour);

  const handleTimeSlotClick = (hour: number) => {
    const newServiceTime = new Date(day);
    newServiceTime.setHours(hour, 0, 0, 0);
    onTimeSlotClick(newServiceTime);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, hour: number) => {
      e.preventDefault();
      const serviceId = e.dataTransfer.getData('serviceId');
      if (serviceId) {
          const newDate = new Date(day);
          newDate.setHours(hour, 0, 0, 0);
          onMoveService(serviceId, newDate);
      }
  };

  return (
    <div className={`relative border-r border-slate-100 dark:border-slate-800 transition-colors ${isSelected ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
       {/* Background Grid & Interaction */}
      {hours.map(hour => (
        <div 
            key={hour} 
            onClick={() => handleTimeSlotClick(hour)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, hour)}
            className="group relative border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            style={{ height: `${timeSlotHeight}px` }}
            role="button"
            aria-label={`Create a new service on ${day.toDateString()} at ${hour}:00`}
        >
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
        </div>
      ))}
      
      {/* Events Overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        <div className="relative w-full h-full">
            {servicesForDay.map(service => {
            const driver = drivers.find(d => d.id === service.driverId);
            const pos = layoutPositions.get(service.id);
            return (
                <div key={service.id} className="pointer-events-auto">
                    <TimeSlotItem 
                        service={service} 
                        onSelect={onSelectService} 
                        timeSlotHeight={timeSlotHeight} 
                        driverAvailability={driver?.availability}
                        startHour={startHour}
                        timeFormat={timeFormat}
                        left={pos?.left}
                        width={pos?.width}
                    />
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};


export const WeekView: React.FC<WeekViewProps> = ({ days, services, selectedDate, onSelectService, onDaySelect, onDayDoubleClick, onTimeSlotClick, onMoveService, zoomLevel, drivers, settings }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timeSlotHeight = settings.compactMode ? 40 : (30 + zoomLevel * 10);
  const startHour = settings.calendarStartHour ?? 0;
  const endHour = settings.calendarEndHour ?? 24;
  const hours = getHours(startHour, endHour);
  
  // Scroll to 6 AM on mount if possible
  useEffect(() => {
      const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
              const targetHour = 6;
              if (targetHour > startHour) {
                  const scrollAmount = (targetHour - startHour) * timeSlotHeight;
                  scrollContainerRef.current.scrollTo({ top: scrollAmount, behavior: 'smooth' });
              }
          }
      }, 50);
      return () => clearTimeout(timer);
  }, [startHour, timeSlotHeight]);

  // Generate localized weekday names
  const weekdayNames = useMemo(() => {
      const names = [];
      const d = new Date();
      d.setDate(d.getDate() - d.getDay()); // Start Sunday
      const localeMap: Record<string, string> = { en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
      const locale = localeMap[settings.language] || 'en-US';

      for(let i=0; i<7; i++) {
          names.push(d.toLocaleString(locale, { weekday: 'short' }));
          d.setDate(d.getDate() + 1);
      }
      return names;
  }, [settings.language]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] sticky top-0 bg-white dark:bg-slate-900 z-30 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-center py-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">&nbsp;</div>
        {days.map((day, index) => (
          <div 
            key={index}
            className={`relative group text-center py-3 border-r border-slate-100 dark:border-slate-800 transition-colors cursor-pointer ${isSameDay(day, selectedDate) ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            onClick={() => onDaySelect(day)}
            onDoubleClick={() => onDayDoubleClick(day)}
          >
            <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wide">{weekdayNames[day.getDay()]}</p>
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold ${isToday(day) ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-800 dark:text-slate-200'}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-[4rem_repeat(7,1fr)] flex-1 overflow-y-auto"
      >
        {/* Time column */}
        <div className="border-r border-slate-100 dark:border-slate-800 text-right pr-3 pt-2 bg-white dark:bg-slate-900 sticky left-0 z-20">
          {hours.map(hour => (
            <div key={hour} className="relative" style={{ height: `${timeSlotHeight}px` }}>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 absolute -top-3 right-0">
                    {settings.timeFormat === '24h' 
                        ? `${hour}:00` 
                        : (hour === 12 ? '12 PM' : (hour > 12 ? `${hour-12} PM` : (hour === 0 || hour === 24 ? '12 AM' : `${hour} AM`)))}
                </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, index) => (
          <DayColumn
            key={index}
            day={day}
            services={services}
            isSelected={isSameDay(day, selectedDate)}
            onSelectService={onSelectService}
            onTimeSlotClick={onTimeSlotClick}
            onMoveService={onMoveService}
            timeSlotHeight={timeSlotHeight}
            drivers={drivers}
            startHour={startHour}
            endHour={endHour}
            timeFormat={settings.timeFormat}
          />
        ))}
      </div>
    </div>
  );
};