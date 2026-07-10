import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  app.setGlobalPrefix('api');
  
  // Trust proxy is required for rate limiting if behind a reverse proxy (like Docker/Nginx)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
