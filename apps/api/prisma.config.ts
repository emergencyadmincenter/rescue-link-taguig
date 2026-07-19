import path from 'path';
import { defineConfig } from 'prisma/config';

// Load .env for local development. In production containers (ECS),
// environment variables are injected directly by the task definition.
// dotenv is a devDependency and will not be installed in production.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch {
  // Expected in production where dotenv is not installed
}

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
