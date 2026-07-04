import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    super({ adapter });
  }

  // Establishes the real TCP connection instantly when NestJS boots
  async onModuleInit() {
    await this.$connect();
  }
  // Disconnects cleanly on shutdown
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
