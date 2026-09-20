import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export function createCorsOrigins(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = createCorsOrigins(
    process.env.CORS_ORIGINS ?? 'http://localhost:55123,http://localhost:4200',
  );
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.setGlobalPrefix('api');
  return app;
}
