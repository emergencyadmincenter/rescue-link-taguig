import { Injectable } from '@nestjs/common';

// Define expected interface
export interface PersonnelItem {
  id: string;
  name: string;
  email: string;
  status: 'pending_activation' | 'active' | 'inactive';
  createdAt: string;
}

export interface PersonnelGroup {
  role: string;
  count: number;
  personnel: PersonnelItem[];
}

@Injectable()
export class PersonnelService {
  // Mock data representing the database state
  private mockUsers: (PersonnelItem & { role: string })[] = [
    {
      id: '1',
      name: 'Mark Dennis Concha',
      email: 'markdennisconcha@resculink.com',
      status: 'active',
      createdAt: new Date().toISOString(),
      role: 'Coordinator',
    },
    {
      id: '2',
      name: 'Liam Patel',
      email: 'liampatel@resculink.com',
      status: 'pending_activation',
      createdAt: new Date().toISOString(),
      role: 'Coordinator',
    },
    {
      id: '3',
      name: 'Ava Thompson',
      email: 'avathompson@resculink.com',
      status: 'pending_activation',
      createdAt: new Date().toISOString(),
      role: 'Coordinator',
    },
    {
      id: '4',
      name: 'Alice Admin',
      email: 'admin@resculink.com',
      status: 'active',
      createdAt: new Date().toISOString(),
      role: 'Admin',
    },
    {
      id: '5',
      name: 'Bob Inactive',
      email: 'bob@resculink.com',
      status: 'inactive',
      createdAt: new Date().toISOString(),
      role: 'Admin',
    },
  ];

  getPersonnel(search?: string, status?: string): { groups: PersonnelGroup[] } {
    let filteredUsers = this.mockUsers;

    // Apply search filter (case-insensitive partial match on name or email)
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch),
      );
    }

    // Apply status filter
    if (status) {
      filteredUsers = filteredUsers.filter((u) => u.status === status);
    }

    // Group by role
    const grouped = filteredUsers.reduce(
      (acc, user) => {
        const roleName = user.role;
        if (!acc[roleName]) {
          acc[roleName] = [];
        }
        acc[roleName].push({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
        });
        return acc;
      },
      {} as Record<string, PersonnelItem[]>,
    );

    // Format to expected response shape
    const allRoles = ['Coordinator', 'Admin']; // Ensures we return empty groups for roles if they have no matches
    const groups: PersonnelGroup[] = allRoles.map((role) => {
      const personnel = grouped[role] || [];
      return {
        role,
        count: personnel.length,
        personnel,
      };
    });

    return { groups };
  }
}
