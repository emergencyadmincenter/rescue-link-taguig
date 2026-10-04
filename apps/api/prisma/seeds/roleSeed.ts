import { PrismaService } from '../../src/database/prisma/prisma.service';

export async function seedRoles(prisma: PrismaService) {
  const roles = ['admin', 'coordinator', 'resident'];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }
  console.log('✅ Roles seeded');
}
