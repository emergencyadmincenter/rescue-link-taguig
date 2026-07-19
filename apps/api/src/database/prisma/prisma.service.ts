import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const isProduction = process.env.NODE_ENV === 'production';
    const certPath = path.join(process.cwd(), 'prisma', 'global-bundle.pem');
    const hasCert = isProduction && fs.existsSync(certPath);

    // In production with AWS RDS, we must explicitly provide the CA certificate
    // to the pg Pool. The pg-connection-string parser does NOT reliably honour
    // the sslrootcert query parameter from the DATABASE_URL, which causes a
    // "self-signed certificate in certificate chain" TLS error.
    let cleanUrl = connectionString;

    if (hasCert) {
      // Strip SSL-related query parameters from the connection string so that
      // pg-connection-string does not create its own ssl config that would
      // overwrite our explicit ssl object below.
      try {
        const url = new URL(connectionString);
        url.searchParams.delete('sslmode');
        url.searchParams.delete('sslrootcert');
        url.searchParams.delete('sslcert');
        url.searchParams.delete('sslkey');
        cleanUrl = url.toString();
      } catch {
        // If URL parsing fails, use the original string
      }
    }

    const pool = new pg.Pool({
      connectionString: cleanUrl,
      ...(hasCert
        ? {
            ssl: {
              rejectUnauthorized: false,
              ca: fs.readFileSync(certPath, 'utf-8'),
            },
          }
        : {}),
    });

    const adapter = new PrismaPg(pool);
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
