
import { Service } from '../types';

export const getMonthDays = (date: Date): Date[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const weeks: Date[][] = [];
  let currentDay = new Date(startDate);

  while (currentDay <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
};

export const formatTime = (date: Date, format: '12h' | '24h' = '12h', locale: string = 'en-US'): string => {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  }).toLowerCase();
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    week.push(day);
  }
  return week;
};

export const getHours = (startHour = 0, endHour = 24) => {
    const hours = [];
    for(let i = startHour; i < endHour; i++) {
        hours.push(i);
    }
    return hours;
}

export interface PositionedService {
    service: Service;
    style: React.CSSProperties;
}

// Logic to stack events side-by-side if they overlap
export const organizeEventsForDay = (services: Service[]): PositionedService[] => {
    // 1. Sort services by start time, then by length (longer first)
    const sorted = [...services].sort((a, b) => {
        const diff = a.startTime.getTime() - b.startTime.getTime();
        if (diff !== 0) return diff;
        // Same start time? longer one first
        const durA = (a.endTime?.getTime() || a.startTime.getTime() + 3600000) - a.startTime.getTime();
        const durB = (b.endTime?.getTime() || b.startTime.getTime() + 3600000) - b.startTime.getTime();
        return durB - durA;
    });

    // 2. Expand with time info needed for collision detection
    const events = sorted.map(s => {
        const start = s.startTime.getTime();
        const end = s.endTime ? s.endTime.getTime() : start + 3600000;
        return {
            ...s,
            _start: start,
            _end: end
        };
    });

    // 3. Group overlapping events
    const columns: any[][] = [];
    let lastEventEndTime: number | null = null;

    // Simplified "Packer" Algorithm
    // We create columns. An event is placed in the first column where it doesn't collide.
    const placements: { event: any, colIndex: number }[] = [];

    events.forEach(event => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const lastInCol = col[col.length - 1];
            if (lastInCol._end <= event._start) {
                col.push(event);
                placements.push({ event, colIndex: i });
                placed = true;
                break;
            }
        }
        if (!placed) {
            columns.push([event]);
            placements.push({ event, colIndex: columns.length - 1 });
        }
    });

    // 4. Determine Widths based on clusters
    // This is a naive approach: Width = 100% / total_columns_at_that_time. 
    // Ideally we find max columns in a "cluster" of overlaps.
    
    // Simpler visual approach: Just use total columns created? No, too narrow if one event is at 9am and another at 5pm.
    // We need to group by "collision clusters".
    
    // Group adjacent events into clusters
    const clusters: any[][] = [];
    let currentCluster: any[] = [];
    let clusterEnd = -1;

    events.forEach(event => {
        if (currentCluster.length === 0) {
            currentCluster.push(event);
            clusterEnd = event._end;
        } else {
            if (event._start < clusterEnd) {
                // Overlaps or touches the current cluster group
                currentCluster.push(event);
                clusterEnd = Math.max(clusterEnd, event._end);
            } else {
                // New cluster
                clusters.push(currentCluster);
                currentCluster = [event];
                clusterEnd = event._end;
            }
        }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    const finalResult: PositionedService[] = [];

    clusters.forEach(cluster => {
        // Recalculate columns specifically for this cluster to get width
        const clusterCols: any[][] = [];
        const clusterPlacements: { id: string, colIndex: number }[] = [];

        cluster.forEach(ev => {
             let placed = false;
             for(let i=0; i<clusterCols.length; i++) {
                 const last = clusterCols[i][clusterCols[i].length - 1];
                 if (last._end <= ev._start) {
                     clusterCols[i].push(ev);
                     clusterPlacements.push({ id: ev.id, colIndex: i });
                     placed = true;
                     break;
                 }
             }
             if (!placed) {
                 clusterCols.push([ev]);
                 clusterPlacements.push({ id: ev.id, colIndex: clusterCols.length - 1 });
             }
        });

        const numCols = clusterCols.length;
        const width = 100 / numCols;

        cluster.forEach(ev => {
            const placement = clusterPlacements.find(p => p.id === ev.id);
            const colIndex = placement ? placement.colIndex : 0;
            
            finalResult.push({
                service: ev,
                style: {
                    width: `${width}%`,
                    left: `${colIndex * width}%`,
                    position: 'absolute'
                }
            });
        });
    });

    return finalResult;
};
