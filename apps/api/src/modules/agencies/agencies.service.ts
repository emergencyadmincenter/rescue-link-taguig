import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class AgenciesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agency.findMany({
      where: { is_active: true },
      include: {
        incident_categories: {
          include: {
            incident_category: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
