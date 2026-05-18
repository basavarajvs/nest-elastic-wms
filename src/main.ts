import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1/wms';
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Web routes: /api/v1/wms/web/*
  // RF routes: /api/v1/wms/rf/*
  // Health: /health (no prefix if needed)
  // RF Sessions: /rf/sessions/* (no prefix)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const flatErrors = errors.map((e) => ({
          field: e.property,
          constraints: Object.values(e.constraints || {}),
        }));
        return new BadRequestException({
          statusCode: 400,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: flatErrors,
        });
      },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port, '0.0.0.0');
  console.log(`WMS Application is running on: http://localhost:${port}`);
  console.log(`Web API: http://localhost:${port}/${apiPrefix}/web`);
  console.log(`RF API: http://localhost:${port}/${apiPrefix}/rf`);
}

bootstrap();
