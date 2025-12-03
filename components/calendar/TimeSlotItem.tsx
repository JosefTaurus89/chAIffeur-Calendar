
import React from 'react';
import { Service, DriverAvailability } from '../../types';
import { EVENT_COLORS } from '../../constants';
import { formatTime } from '../../lib/calendar-utils';

interface TimeSlotItemProps {
  service: Service;
  onSelect: (service: Service) => void;
  timeSlotHeight: number;
  driverAvailability?: DriverAvailability;
  startHour?: number;
  timeFormat: '12h' | '24h';
  style?: React.CSSProperties; // New prop for column layout
}

export const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ service, onSelect, timeSlotHeight, startHour = 0, timeFormat, style }) => {
  // Default uniform color for all services (Blue/Indigo style)
  const defaultColorClass = 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400';

  // Only use specific color if explicitly set by user, otherwise default
  const isDefaultColor = !service.color || service.color === 'Default';
  const colorClasses = isDefaultColor 
    ? defaultColorClass
    : (EVENT_COLORS[service.color!] || defaultColorClass);

  const isUnassigned = !service.driverId && !service.supplierId;

  const start = service.startTime;
  const end = service.endTime || new Date(start.getTime() + 60 * 60 * 1000); // Default to 1 hour if no end time

  const startInHours = start.getHours() + start.getMinutes() / 60;
  // adjust for custom start hour of the calendar grid
  const adjustedStartHour = startInHours - startHour;
  
  const top = adjustedStartHour * timeSlotHeight;
  
  const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const height = (durationInMinutes / 60) * timeSlotHeight;

  // Ensure minimum height for visibility
  const minHeight = 24;
  const finalHeight = Math.max(height, minHeight);
  const showDetails = finalHeight > 45; // Threshold to show extra lines

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.setData('serviceId', service.id);
      e.dataTransfer.setData('duration', durationInMinutes.toString());
      e.dataTransfer.effectAllowed = 'move';
      e.stopPropagation();
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(service);
      }}
      draggable
      onDragStart={handleDragStart}
      className={`absolute w-[96%] left-[2%] text-left px-2 py-0.5 rounded-md cursor-grab active:cursor-grabbing hover:brightness-95 hover:shadow-md transition-all z-10 flex flex-col justify-center overflow-hidden shadow-sm border-l-[3px] ${colorClasses} ${isUnassigned ? 'opacity-90 border-dashed border-2 border-amber-400' : ''}`}
      style={{
        ...style,
        top: `${top}px`,
        height: `${finalHeight}px`,
      }}
      title={`${service.title} (${formatTime(start, timeFormat)})`}
      aria-label={`Service: ${service.title}`}
    >
      <div className="font-bold text-xs truncate w-full flex items-center leading-tight">
        {isUnassigned && <span className="text-amber-600 font-extrabold mr-1 text-sm">!</span>}
        {service.title}
      </div>
      
      {/* If we have enough height, show time and client */}
      {showDetails && (
          <div className="mt-0.5">
            <div className="text-[10px] font-medium opacity-90 truncate w-full">
                {formatTime(start, timeFormat)} - {formatTime(end, timeFormat)}
            </div>
            <div className="text-[10px] font-normal truncate opacity-80 w-full border-t border-current mt-0.5 pt-0.5">
                {service.clientName}
            </div>
          </div>
      )}
    </button>
  );
};
