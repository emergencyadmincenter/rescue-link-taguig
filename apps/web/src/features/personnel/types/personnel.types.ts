export type PersonnelStatus = 'active' | 'pending_activation' | 'inactive';

export type PersonnelEntry = {
  id: string;
  name: string;
  email: string;
  status: PersonnelStatus;
  createdAt: string;
};

export type PersonnelGroup = {
  role: string;          // display name e.g. "Coordinator"
  roleKey: string;       // raw key e.g. "coordinator"
  count: number;
  personnel: PersonnelEntry[];
};

export type PersonnelListResponse = {
  groups: PersonnelGroup[];
};
