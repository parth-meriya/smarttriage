export type Priority = 1 | 2 | 3 | 4;
export type Role = 'Doctor' | 'Nurse' | 'Admin' | 'Patient';

export interface Patient {
  name: string;
  initials: string;
  age: number;
  complaint: string;
  priority: Priority;
  wait: string;
  vital: string;
  status: string;
  room: string;
  gender?: string;
  mrn?: string;
  registeredAt?: string;
  spo2?: number;
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
  temperature?: string;
}

export const priorityMeta = {
  1: { label: 'Emergency', code: 'LEVEL 1', color: 'red', tint: 'red-tint' },
  2: { label: 'High priority', code: 'LEVEL 2', color: 'amber', tint: 'amber-tint' },
  3: { label: 'Urgent', code: 'LEVEL 3', color: 'gold', tint: 'gold-tint' },
  4: { label: 'Non-urgent', code: 'LEVEL 4', color: 'teal', tint: 'teal-tint' },
} as const;
