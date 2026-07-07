import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { AppModule } from './app.module';

// Allow BigInt serialization in JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const apiPrefix = configService.get('API_PREFIX', 'api/v1/wms');
  app.setGlobalPrefix(apiPrefix);

  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  const corsOrigins = configService.get('CORS_ORIGINS', '*');
  await app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map((o: string) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Code', 'X-Facility-Code'],
  });

  const redisClient = app.get('REDIS_CLIENT');
  await app.register(rateLimit, {
    redis: redisClient,
    global: true,
    max: Number(configService.get('RATE_LIMIT_GLOBAL_LIMIT')) || 100,
    timeWindow: Number(configService.get('RATE_LIMIT_GLOBAL_TTL')) || 60000,
  });

  if (configService.get('SWAGGER_ENABLED') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('WMS API')
      .setDescription('Warehouse Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3002);
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger UI at http://localhost:${port}/api/docs`);
}

bootstrap();
