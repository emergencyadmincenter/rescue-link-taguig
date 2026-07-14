import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { MailService } from '../mail/mail.service';

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
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreatePersonnelDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.role_id },
    });
    if (!role) {
      throw new NotFoundException('Selected role does not exist');
    }

    const activationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          status: 'pending_activation',
        },
      });

      await tx.userRole.create({
        data: {
          user_id: user.id,
          role_id: dto.role_id,
        },
      });

      const token = await tx.userToken.create({
        data: {
          user_id: user.id,
          type: 'activation',
          token: activationToken,
          status: 'active',
          expires_at: expiresAt,
        },
      });

      return { user, token };
    });

    await this.mailService.sendActivationEmail(
      result.user.email,
      result.user.name,
      result.token.token,
    );

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
      role_id: dto.role_id,
    };
  }

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
    const grouped = filteredUsers.reduce((acc, user) => {
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
    }, {} as Record<string, PersonnelItem[]>);

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
