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
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Liam Patel',
        email: 'liampatel@resculink.com',
        status: 'pending_activation',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Ava Thompson',
        email: 'avathompson@resculink.com',
        status: 'inactive',
        createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
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
