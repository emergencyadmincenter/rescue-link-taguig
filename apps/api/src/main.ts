import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS?.split(',').map((origin) =>
          origin.trim(),
        ) ?? [])
      : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health/live', 'health/ready'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ');
        return new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: messages,
          },
        });
      },
    }),
  );

  app.enableShutdownHooks();

  // Trust proxy is required for rate limiting if behind a reverse proxy (like Docker/Nginx)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
