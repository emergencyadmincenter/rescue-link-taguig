import { PrismaService } from '../../src/database/prisma/prisma.service';
import { UserStatus } from '../../src/generated/prisma/client';

import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaService) {
  const adminEmail = 'rescuelinktaguig@gmail.com';
  const passwordHash = await bcrypt.hash('RescueLinkTaguig_BSCS3A', 10);

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

  // Coordinators (Development only)
  if (process.env.NODE_ENV !== 'production') {
    // Coordinator 1
    await prisma.user.upsert({
      where: { email: 'coordinator1@example.com' },
      update: {},
      create: {
        name: 'Coordinator One',
        email: 'coordinator1@example.com',
        password_hash: passwordHash,
        status: UserStatus.active,
      },
    });

    // Coordinator 2
    await prisma.user.upsert({
      where: { email: 'coordinator2@example.com' },
      update: {},
      create: {
        name: 'Coordinator Two',
        email: 'coordinator2@example.com',
        password_hash: passwordHash,
        status: UserStatus.active,
      },
    });
  }

  console.log('✅ Users seeded');
}
