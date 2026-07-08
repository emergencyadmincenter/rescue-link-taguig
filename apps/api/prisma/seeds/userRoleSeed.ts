import { PrismaService } from "../../src/database/prisma/prisma.service";

export async function seedUserRoles(prisma: PrismaService) {
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  const user = await prisma.user.findUnique({
    where: { email: 'rescuelinktaguig@gmail.com' },
  });

  if (!adminRole || !user) {
    throw new Error('Admin role or target user not found. Run other seeds first.');
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
  console.log('✅ UserRole seeded');
}
