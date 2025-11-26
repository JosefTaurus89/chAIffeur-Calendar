import { Service } from '../types';

export interface LayoutPosition {
  left: number;
  width: number;
}

/**
 * Calculates horizontal positioning for services to avoid overlap.
 * Returns a map of serviceId -> { left: percentage, width: percentage }
 */
export const calculateEventPositions = (services: Service[]): Map<string, LayoutPosition> => {
  const positions = new Map<string, LayoutPosition>();
  
  // 1. Sort services by start time, then descending by duration
  const sorted = [...services].sort((a, b) => {
    const startDiff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (startDiff !== 0) return startDiff;
    
    const endA = a.endTime ? new Date(a.endTime).getTime() : new Date(a.startTime).getTime() + 3600000;
    const endB = b.endTime ? new Date(b.endTime).getTime() : new Date(b.startTime).getTime() + 3600000;
    
    const durA = endA - new Date(a.startTime).getTime();
    const durB = endB - new Date(b.startTime).getTime();
    return durB - durA;
  });

  // 2. Group into connected clusters (events that overlap transitively)
  const clusters: Service[][] = [];
  
  if (sorted.length > 0) {
      let currentCluster: Service[] = [sorted[0]];
      let clusterEnd = sorted[0].endTime ? new Date(sorted[0].endTime).getTime() : new Date(sorted[0].startTime).getTime() + 3600000;

      for (let i = 1; i < sorted.length; i++) {
          const service = sorted[i];
          const start = new Date(service.startTime).getTime();
          const end = service.endTime ? new Date(service.endTime).getTime() : start + 3600000;

          if (start < clusterEnd) {
              // Overlaps with the current cluster
              currentCluster.push(service);
              clusterEnd = Math.max(clusterEnd, end);
          } else {
              // Starts after the current cluster ends -> New cluster
              clusters.push(currentCluster);
              currentCluster = [service];
              clusterEnd = end;
          }
      }
      clusters.push(currentCluster);
  }

  // 3. Process each cluster to assign columns
  clusters.forEach(cluster => {
      const columns: Service[][] = [];
      
      cluster.forEach(service => {
          let placed = false;
          // Try to place in existing columns
          for (let i = 0; i < columns.length; i++) {
              const lastInCol = columns[i][columns[i].length - 1];
              const lastEnd = lastInCol.endTime ? new Date(lastInCol.endTime).getTime() : new Date(lastInCol.startTime).getTime() + 3600000;
              
              // If this service starts after the last one in this column ends, we can stack it here
              if (new Date(service.startTime).getTime() >= lastEnd) {
                  columns[i].push(service);
                  // Temporarily store column index as left
                  positions.set(service.id, { left: i, width: 0 });
                  placed = true;
                  break;
              }
          }
          
          // If couldn't place in any existing column, add a new one
          if (!placed) {
              columns.push([service]);
              positions.set(service.id, { left: columns.length - 1, width: 0 });
          }
      });

      // 4. Calculate final percentages
      const numCols = columns.length;
      const colWidth = 100 / numCols;

      cluster.forEach(service => {
          const pos = positions.get(service.id);
          if (pos) {
              // Apply percentage values
              // Standardize to CSS percentages
              positions.set(service.id, {
                  left: pos.left * colWidth,
                  width: colWidth
              });
          }
      });
  });

  return positions;
};