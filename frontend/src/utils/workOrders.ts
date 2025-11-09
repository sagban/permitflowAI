import { WorkOrder } from '@/types';

let cachedWorkOrders: WorkOrder[] | null = null;

export const loadWorkOrders = async (): Promise<WorkOrder[]> => {
  if (cachedWorkOrders) {
    return cachedWorkOrders;
  }

  try {
    const response = await fetch('/workOrders.json');
    const data = await response.json();
    cachedWorkOrders = (data as { workOrders: WorkOrder[] }).workOrders.map(wo => ({
      ...wo,
      title: wo.description.substring(0, 100) + (wo.description.length > 100 ? '...' : ''),
    }));
    return cachedWorkOrders;
  } catch (error) {
    console.error('Failed to load work orders:', error);
    return [];
  }
};

export const loadWorkOrdersSync = (): WorkOrder[] => {
  if (cachedWorkOrders) {
    return cachedWorkOrders;
  }
  return [];
};

