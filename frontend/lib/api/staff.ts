export interface StaffAccount {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'Admin';
  title: string;
  username: string;
  password: string;
  department: string;
  room: string;
  status: 'On Duty' | 'In Consultation' | 'On Break';
  patientsAssigned: number;
  phone: string;
  createdBy: string;
  createdAt: string;
}

const STORAGE_KEY = 'smarttriage_staff_accounts';

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'STF-101',
    name: 'Dr. Alex Rivera, MD',
    role: 'Doctor',
    title: 'Emergency Physician',
    username: 'dr_alex',
    password: 'DoctorPass123!',
    department: 'Emergency Medicine',
    room: 'Exam Room 1',
    status: 'In Consultation',
    patientsAssigned: 4,
    phone: '+1 (555) 234-5678',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 1, 2026',
  },
  {
    id: 'STF-102',
    name: 'Dr. Elena Rostova, MD',
    role: 'Doctor',
    title: 'Trauma Surgeon',
    username: 'dr_elena',
    password: 'ElenaPass123!',
    department: 'Trauma Surgery',
    room: 'Trauma Bay A',
    status: 'On Duty',
    patientsAssigned: 2,
    phone: '+1 (555) 345-6789',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 2, 2026',
  },
  {
    id: 'STF-103',
    name: 'Dr. Raj Mehta, MD',
    role: 'Doctor',
    title: 'Internal Medicine',
    username: 'dr_raj',
    password: 'RajPass123!',
    department: 'Internal Medicine',
    room: 'Exam Room 3',
    status: 'On Duty',
    patientsAssigned: 3,
    phone: '+1 (555) 456-1234',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 3, 2026',
  },
  {
    id: 'STF-104',
    name: 'Dr. Anya Okonkwo, MD',
    role: 'Doctor',
    title: 'Paediatric Emergency',
    username: 'dr_anya',
    password: 'AnyaPass123!',
    department: 'Paediatric Emergency',
    room: 'Paeds Bay 1',
    status: 'On Break',
    patientsAssigned: 1,
    phone: '+1 (555) 567-2345',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 4, 2026',
  },
  {
    id: 'STF-201',
    name: 'Jordan Lee, RN',
    role: 'Nurse',
    title: 'Triage Nurse',
    username: 'jordan_lee',
    password: 'NursePass123!',
    department: 'Emergency Triage',
    room: 'Triage Desk 1',
    status: 'On Duty',
    patientsAssigned: 6,
    phone: '+1 (555) 456-7890',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 1, 2026',
  },
  {
    id: 'STF-202',
    name: 'Marcus Vance, BSN',
    role: 'Nurse',
    title: 'Charge Nurse',
    username: 'marcus_vance',
    password: 'NursePass123!',
    department: 'Emergency Medicine',
    room: 'Central Nursing Hub',
    status: 'On Duty',
    patientsAssigned: 8,
    phone: '+1 (555) 567-8901',
    createdBy: 'Dr. Alex Rivera',
    createdAt: 'Sep 3, 2026',
  },
  {
    id: 'STF-203',
    name: 'Nina Kowalski, RN',
    role: 'Nurse',
    title: 'Triage Nurse',
    username: 'nina_kowalski',
    password: 'NinaPass123!',
    department: 'Emergency Triage',
    room: 'Triage Desk 2',
    status: 'On Duty',
    patientsAssigned: 5,
    phone: '+1 (555) 678-3456',
    createdBy: 'Hospital Admin',
    createdAt: 'Sep 5, 2026',
  },
  {
    id: 'STF-204',
    name: 'Carlos Reyes, RN',
    role: 'Nurse',
    title: 'Trauma Nurse',
    username: 'carlos_reyes',
    password: 'CarlosPass123!',
    department: 'Trauma Surgery',
    room: 'Trauma Bay B',
    status: 'In Consultation',
    patientsAssigned: 3,
    phone: '+1 (555) 789-4567',
    createdBy: 'Dr. Elena Rostova',
    createdAt: 'Sep 5, 2026',
  },
  {
    id: 'STF-301',
    name: 'Sam Morgan',
    role: 'Admin',
    title: 'Operations Director',
    username: 'sam_morgan',
    password: 'AdminPass123!',
    department: 'Operations & Triage',
    room: 'Admin Suite 2',
    status: 'On Duty',
    patientsAssigned: 0,
    phone: '+1 (555) 678-9012',
    createdBy: 'System Root',
    createdAt: 'Sep 1, 2026',
  },
];

export function getStaffAccounts(): StaffAccount[] {
  if (typeof window === 'undefined') return INITIAL_STAFF_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
      return INITIAL_STAFF_ACCOUNTS;
    }
    return JSON.parse(raw) as StaffAccount[];
  } catch {
    return INITIAL_STAFF_ACCOUNTS;
  }
}

export function saveStaffAccount(
  account: Omit<StaffAccount, 'id' | 'createdAt' | 'patientsAssigned' | 'status'>
): StaffAccount {
  const current = getStaffAccounts();
  const idPrefix = account.role === 'Doctor' ? 'STF-1' : account.role === 'Nurse' ? 'STF-2' : 'STF-3';
  const nextNumber = Math.floor(10 + Math.random() * 90);
  const newAccount: StaffAccount = {
    ...account,
    id: `${idPrefix}${nextNumber}`,
    status: 'On Duty',
    patientsAssigned: 0,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const updated = [newAccount, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newAccount;
}

export function deleteStaffAccount(id: string): boolean {
  const current = getStaffAccounts();
  const filtered = current.filter((s) => s.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return filtered.length !== current.length;
}

export function findStaffAccountByUsername(username: string): StaffAccount | undefined {
  const accounts = getStaffAccounts();
  return accounts.find((s) => s.username.toLowerCase() === username.toLowerCase());
}
