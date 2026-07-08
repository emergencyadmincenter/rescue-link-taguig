import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'prisma/config';

config({ path: path.join(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: "tsx prisma/seed.ts "
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
