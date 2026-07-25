import { PrismaClient } from './apps/api/src/generated/prisma';
const p = new PrismaClient();
p.fraudAssessment.findMany().then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(0); });
