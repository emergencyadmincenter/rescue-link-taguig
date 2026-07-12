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

  // Coordinator 1
  const coord1Email = 'coordinator1@rescuelink.com';
  await prisma.user.upsert({
    where: { email: coord1Email },
    update: {},
    create: {
      name: 'Coordinator One',
      email: coord1Email,
      password_hash: passwordHash,
      status: UserStatus.active,
    },
  });

  // Coordinator 2
  const coord2Email = 'coordinator2@rescuelink.com';
  await prisma.user.upsert({
    where: { email: coord2Email },
    update: {},
    create: {
      name: 'Coordinator Two',
      email: coord2Email,
      password_hash: passwordHash,
      status: UserStatus.active,
    },
  });

  console.log('✅ Users seeded');
}
