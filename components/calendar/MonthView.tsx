
import React from 'react';
import { Service, User, AppSettings } from '../../types';
import { isSameDay, isToday } from '../../lib/calendar-utils';
import { ServiceItem } from './ServiceItem';

interface MonthViewProps {
  weeks: Date[][];
  services: Service[];
  currentMonth: number;
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

// More compact height maps
const zoomHeightMap: Record<number, string> = {
  1: 'min-h-[3rem]', 
  2: 'min-h-[4rem]',
  3: 'min-h-[5rem]',
  4: 'min-h-[6rem]',
  5: 'min-h-[8rem]',
};

export const MonthView: React.FC<MonthViewProps> = ({ weeks, services, currentMonth, selectedDate, onSelectService, onDaySelect, onDayDoubleClick, onTimeSlotClick, onMoveService, drivers, zoomLevel, settings }) => {
  // Force a simpler view if compactMode is on or just default to something more Google-like
  const dayCellHeight = settings.compactMode ? 'min-h-[3.5rem]' : (zoomHeightMap[zoomLevel] || 'min-h-[5rem]');

  const handleCellClick = (day: Date) => {
    onDaySelect(day);
    // Quick Create: Set time to 9:00 AM on the clicked day
    const newServiceTime = new Date(day);
    newServiceTime.setHours(9, 0, 0, 0);
    onTimeSlotClick(newServiceTime);
  };
  
  // Navigate to Day View when clicking a service in Month view
  const handleServiceClickInMonth = (service: Service) => {
      onDaySelect(service.startTime);
      // Trigger switching to Day View by calling the double-click handler
      onDayDoubleClick(service.startTime);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
      e.preventDefault();
      const serviceId = e.dataTransfer.getData('serviceId');
      if (serviceId) {
          onMoveService(serviceId, day);
      }
  };

  return (
    <div className="grid grid-cols-7 grid-rows-[repeat(6,1fr)] h-full border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {weeks.map((week, i) => (
        <React.Fragment key={i}>
          {week.map((day, j) => {
            const servicesForDay = services.filter(service => isSameDay(service.startTime, day));
            const isCurrentMonth = day.getMonth() === currentMonth;
            const today = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={j}
                onClick={() => handleCellClick(day)}
                onDoubleClick={(e) => { e.stopPropagation(); onDayDoubleClick(day); }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                className={`relative group border-b border-r border-slate-200 dark:border-slate-700 flex flex-col cursor-pointer transition-colors ${dayCellHeight} ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400' : 'bg-white dark:bg-slate-900'} hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                role="button"
                aria-label={`View day ${day.toDateString()}`}
              >
                {/* Date Header */}
                <div className="flex justify-center pt-1">
                  <span
                    className={`text-[10px] font-medium rounded-full w-5 h-5 flex items-center justify-center transition-colors ${
                      today
                        ? 'bg-primary-600 text-white'
                        : (isSelected ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-700 dark:text-slate-400')
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                
                {/* Events Container */}
                <div className="flex-1 flex flex-col gap-[1px] overflow-hidden px-0.5 pb-1" onClick={(e) => e.stopPropagation()}>
                  {servicesForDay.map(service => {
                    return (
                        <ServiceItem 
                            key={service.id} 
                            service={service} 
                            onSelect={handleServiceClickInMonth} 
                            zoomLevel={zoomLevel}
                            isMonthView={true} // Force compact style for month view
                        />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
