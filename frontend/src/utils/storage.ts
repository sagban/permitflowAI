import { Permit, Validation, Hazard } from '@/types';

const PERMITS_KEY_PREFIX = 'permits_';
const STATUS_KEY_PREFIX = 'wo_status_';
const HAZARDS_KEY_PREFIX = 'hazards_';

export const storage = {
  getPermits: (workOrderId: string): Permit[] => {
    const key = `${PERMITS_KEY_PREFIX}${workOrderId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  savePermits: (workOrderId: string, permits: Permit[]): void => {
    const key = `${PERMITS_KEY_PREFIX}${workOrderId}`;
    localStorage.setItem(key, JSON.stringify(permits));
  },

  getPermit: (permitId: string): Permit | null => {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith(PERMITS_KEY_PREFIX)) {
        const permits: Permit[] = JSON.parse(localStorage.getItem(key) || '[]');
        const permit = permits.find(p => p.permitId === permitId);
        if (permit) return permit;
      }
    }
    return null;
  },

  updatePermit: (permit: Permit): void => {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith(PERMITS_KEY_PREFIX)) {
        const permits: Permit[] = JSON.parse(localStorage.getItem(key) || '[]');
        const index = permits.findIndex(p => p.permitId === permit.permitId);
        if (index !== -1) {
          permits[index] = permit;
          localStorage.setItem(key, JSON.stringify(permits));
          return;
        }
      }
    }
  },

  getStatus: (workOrderId: string): 'New' | 'In-Progress' | 'Completed' => {
    const key = `${STATUS_KEY_PREFIX}${workOrderId}`;
    const status = localStorage.getItem(key);
    return (status as 'New' | 'In-Progress' | 'Completed') || 'New';
  },

  setStatus: (workOrderId: string, status: 'New' | 'In-Progress' | 'Completed'): void => {
    const key = `${STATUS_KEY_PREFIX}${workOrderId}`;
    localStorage.setItem(key, status);
  },

  getHazards: (workOrderId: string): Hazard[] => {
    const key = `${HAZARDS_KEY_PREFIX}${workOrderId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  saveHazards: (workOrderId: string, hazards: Hazard[]): void => {
    const key = `${HAZARDS_KEY_PREFIX}${workOrderId}`;
    localStorage.setItem(key, JSON.stringify(hazards));
  },

  getValidation: (permitId: string): Validation | null => {
    const key = `validation_${permitId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  saveValidation: (validation: Validation): void => {
    const key = `validation_${validation.permitId}`;
    localStorage.setItem(key, JSON.stringify(validation));
  },
};

