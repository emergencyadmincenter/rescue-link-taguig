import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { LogsModule } from './modules/logs/logs.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { jwtConfig, throttlerConfig } from './config/env.config';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { PersonnelModule } from './modules/personnel/personnel.module';
import { WeatherModule } from './modules/weather/weather.module';
import { HealthModule } from './health/health.module';
import { InsightsModule } from './modules/insights/insights.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, throttlerConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('throttler.default.ttl') || 60000,
            limit: config.get<number>('throttler.default.limit') || 100,
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    LogsModule,
    CommunicationsModule,
    PersonnelModule,
    WeatherModule,
    HealthModule,
    InsightsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
