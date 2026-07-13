import { PrismaService } from "../../src/database/prisma/prisma.service";

export async function seedUserRoles(prisma: PrismaService) {
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  const user = await prisma.user.findUnique({
    where: { email: 'rescuelinktaguig@gmail.com' },
  });

  const coordinatorRole = await prisma.role.findUnique({
    where: { name: 'coordinator' },
  });

  if (!adminRole || !user || !coordinatorRole) {
    throw new Error('Roles or target users not found. Run other seeds first.');
  }

  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: user.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      role_id: adminRole.id,
    },
  });

  const coord1 = await prisma.user.findUnique({ where: { email: 'coordinator1@rescuelink.com' } });
  const coord2 = await prisma.user.findUnique({ where: { email: 'coordinator2@rescuelink.com' } });

  if (coord1) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: coord1.id, role_id: coordinatorRole.id } },
      update: {},
      create: { user_id: coord1.id, role_id: coordinatorRole.id },
    });
  }

  if (coord2) {
    await prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: coord2.id, role_id: coordinatorRole.id } },
      update: {},
      create: { user_id: coord2.id, role_id: coordinatorRole.id },
    });
  }

  console.log('✅ UserRoles seeded');
}
