import { PrismaService } from '../../src/database/prisma/prisma.service';
import { UserStatus } from '../../src/generated/prisma/client';

import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaService) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('❌ Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD must be set to run the seed.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Default Admin
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Emergency Admin Center',
      email: adminEmail,
      password_hash: passwordHash,
      status: UserStatus.active,
    },
  });

  console.log('✅ Users seeded');
}
