import { PrismaService } from '../../src/database/prisma/prisma.service';
import { UserStatus } from '../../src/generated/prisma/client';

import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaService) {
  const email = 'rescuelinktaguig@gmail.com';
  const passwordHash = await bcrypt.hash('RescueLinkTaguig_BSCS3A', 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Emergency Admin Center',
      email,
      password_hash: passwordHash,
      status: UserStatus.active,
    },
  });
  console.log('✅ User seeded');
}
