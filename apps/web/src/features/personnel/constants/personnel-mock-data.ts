import { PersonnelGroup } from '../types/personnel.types';

export const MOCK_PERSONNEL_GROUPS: PersonnelGroup[] = [
  {
    role: 'Coordinator',
    roleKey: 'coordinator',
    count: 3,
    personnel: [
      {
        id: '1',
        name: 'Mark Dennis Concha',
        email: 'markdennisconcha@resculink.com',
        status: 'active',
        createdAt: '2026-03-15T08:30:00.000Z',
        phone: '+63 917 123 4567',
        location: 'Taguig City, Metro Manila',
        lastActive: '2026-07-13T04:15:00.000Z',
      },
      {
        id: '2',
        name: 'Liam Patel',
        email: 'liampatel@resculink.com',
        status: 'pending_activation',
        createdAt: '2026-07-01T10:00:00.000Z',
        phone: '+63 918 987 6543',
        location: 'Makati City, Metro Manila',
      },
      {
        id: '3',
        name: 'Ava Thompson',
        email: 'avathompson@resculink.com',
        status: 'inactive',
        createdAt: '2026-01-20T14:45:00.000Z',
        location: 'Quezon City, Metro Manila',
        lastActive: '2026-05-10T11:30:00.000Z',
      },
    ],
  },
  {
    role: 'Admin',
    roleKey: 'admin',
    count: 1,
    personnel: [
      {
        id: '4',
        name: 'Juan Dela Cruz',
        email: 'juandelacruz@resculink.com',
        status: 'active',
        createdAt: '2025-11-05T09:00:00.000Z',
        phone: '+63 916 555 7890',
        location: 'Taguig City, Metro Manila',
        lastActive: '2026-07-13T03:45:00.000Z',
      },
    ],
  },
  {
    role: 'Rescuer',
    roleKey: 'rescuer',
    count: 0,
    personnel: [],
  },
];
