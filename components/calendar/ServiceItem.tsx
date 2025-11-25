
import React from 'react';
import { Service } from '../../types';
import { EVENT_COLORS } from '../../constants';

interface ServiceItemProps {
  service: Service;
  onSelect: (service: Service) => void;
  zoomLevel: number;
  timeFormat?: '12h' | '24h';
  isMonthView?: boolean;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({ service, onSelect, isMonthView }) => {
  // Default uniform color for all services
  const defaultColorClass = 'bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-400';
  
  // Use specific color if set, otherwise default
  const isDefaultColor = !service.color || service.color === 'Default';
  const colorClasses = isDefaultColor 
    ? defaultColorClass 
    : (EVENT_COLORS[service.color!] || defaultColorClass);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.setData('serviceId', service.id);
      const duration = service.endTime 
        ? (service.endTime.getTime() - service.startTime.getTime()) / (1000 * 60)
        : 60;
      e.dataTransfer.setData('duration', duration.toString());
      e.dataTransfer.effectAllowed = 'move';
  };

  if (isMonthView) {
      // Ultra-compact style for Month View (Google Calendar style bars)
      return (
        <button
            onClick={(e) => { e.stopPropagation(); onSelect(service); }}
            draggable
            onDragStart={handleDragStart}
            className={`
                w-full text-left px-1.5 py-[1px] rounded-[2px] text-[10px] 
                cursor-pointer hover:brightness-95 transition-all 
                truncate leading-tight mb-[1px]
                ${colorClasses.replace('border-l-[3px]', 'border-l-2')} // Thinner border
            `}
            title={`${service.title} - ${service.clientName}`}
        >
            <span className="font-semibold truncate block">
                {service.title}
            </span>
        </button>
      );
  }

  // Standard style for Day/List views (handled mostly by TimeSlotItem, but fallback here)
  return (
    <button
      onClick={(e) => {
          e.stopPropagation();
          onSelect(service);
      }}
      draggable
      onDragStart={handleDragStart}
      className={`
        w-full text-left px-1.5 py-0.5 rounded-[3px] text-[11px] 
        cursor-pointer hover:brightness-95 transition-all 
        border-l-[3px] truncate leading-tight
        ${colorClasses}
      `}
      title={`${service.title} - ${service.clientName}`}
    >
      <span className="font-semibold truncate block">
        {service.title}
      </span>
    </button>
  );
};
