import { seedRoles } from './seeds/roleSeed';
import { seedPermissions } from './seeds/permissionSeed';
import { seedUsers } from './seeds/userSeed';
import { seedUserRoles } from './seeds/userRoleSeed';
import { PrismaService } from '../src/database/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Starting database seed...');
  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedUsers(prisma);
  await seedUserRoles(prisma);
  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
