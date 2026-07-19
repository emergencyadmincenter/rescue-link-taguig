import { PrismaService } from "../../src/database/prisma/prisma.service";

export async function seedUserRoles(prisma: PrismaService) {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    throw new Error('❌ Missing required environment variable: ADMIN_EMAIL must be set to run the seed.');
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
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

  console.log('✅ UserRoles seeded');
}
