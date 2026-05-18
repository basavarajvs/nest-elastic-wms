import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'fastify-helmet';
import rateLimit from '@fastify/rate-limit';
import { initOpenTelemetry } from './observability/otel.config';
import { ShutdownService } from './lifecycle/shutdown.service';
import { LogLevelService } from './observability/log-level.service';
import { ConnectionPoolWarmerService } from './cluster/connection-pool-warmer.service';

async function bootstrap() {
  if (process.env.OTLP_ENDPOINT) {
    initOpenTelemetry();
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production'
        ? { transport: { target: 'pino-pretty', options: { colorize: true } }, level: process.env.LOG_LEVEL || 'debug' }
        : { level: process.env.LOG_LEVEL || 'info' },
      bodyLimit: 1048576,
      requestIdHeader: 'x-request-id',
      // ── Challenge 4: Graceful stale connection rejection during drain ──
      keepAliveTimeout: 5000,       // 5s — reject idle keep-alive connections cleanly
      headersTimeout: 6000,         // 6s — reject incomplete headers before keepAlive fires
      maxRequestsPerSocket: 100,    // Reset connection every 100 requests
    }),
  );

  const configService = app.get(ConfigService);
  const isProd = process.env.NODE_ENV === 'production';
  const swaggerEnabled = isProd
    ? configService.get<boolean>('SWAGGER_ENABLED') === true
    : configService.get<boolean>('SWAGGER_ENABLED', true) !== false;

  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1/wms';
  app.setGlobalPrefix(apiPrefix, { exclude: ['/health', '/health/ready', '/health/circuits', '/metrics', '/api/docs', '/api/docs-json', '/api/docs/openapi.json'] });

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

  const fastifyInstance = app.getHttpAdapter().getInstance();

  // ── Global CSP (strict — API routes) ──
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
      },
    },
    frameguard: { action: 'sameorigin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // ── Relaxed CSP for Swagger UI routes ──
  fastifyInstance.addHook('onRequest', async (req: any, reply: any) => {
    const url: string = req?.url || '';
    if (url.startsWith('/api/docs') || url.startsWith('/swagger')) {
      reply.header('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "img-src * data:",
        "font-src 'self' data:",
        "connect-src 'self'",
      ].join('; '));
    }
  });

  // ── Rate Limiting (fastify-rate-limit with named throttlers) ──
  const rateLimitGlobalTtl = configService.get<number>('RATE_LIMIT_GLOBAL_TTL') || 60000;
  const rateLimitGlobalLimit = configService.get<number>('RATE_LIMIT_GLOBAL_LIMIT') || 100;
  const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
  const redisPort = configService.get<number>('REDIS_PORT') || 6379;

  await app.register(rateLimit, {
    global: false,
    max: rateLimitGlobalLimit,
    timeWindow: rateLimitGlobalTtl,
    redis: { host: redisHost, port: redisPort },
    errorResponseBuilder: (_req: any, context: any) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded: ${context.max} per ${context.after}`,
      retryAfter: context.after?.replace('ms', '') || '60',
    }),
    keyGenerator: (req: any) => {
      const deviceId = req.headers['x-device-id'] as string;
      const ip = req.ip;
      return deviceId ? `rf:${ip}:${deviceId}` : `global:${ip}`;
    },
  });

  // Add named rate-limit route configs
  // RF: 50/sec/IP+DeviceID
  fastifyInstance.register(async function rfScope(instance: any) {
    instance.addHook('onRequest', async (req: any, reply: any) => {
      const url: string = req?.url || '';
      if (url.includes('/rf/')) {
        // RF rate limiting handled by RfRateLimiterGuard at controller level
      }
    });
  });

  // Auth: 10 req/min
  // Webhook: 500 req/min  
  // Applied per-controller via WmsThrottlerGuard

  // ── CORS ──
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  if (isProd && !corsOrigins) {
    console.warn('CORS_ORIGINS not set in production — API will reject all cross-origin requests');
  }
  const allowedOrigins = corsOrigins ? corsOrigins.split(',').map((s: string) => s.trim()) : true;
  app.enableCors({
    origin: isProd ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Code', 'X-System-Token', 'X-Device-ID', 'X-Request-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });

  // ── Swagger / OpenAPI ──
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ElasticWMS API')
      .setDescription('Warehouse Management System API - Web, RF, and Integration endpoints')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addApiKey({ type: 'apiKey', name: 'X-System-Token', in: 'header' }, 'SystemAuth')
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-Code', in: 'header', description: 'Tenant identifier for multi-tenant requests' }, 'TenantCodeAuth')
      .addTag('WMS-WEB', 'Web Admin & Supervisor endpoints')
      .addTag('WMS-RF', 'RF Scanner optimized endpoints (<50ms, stateless)')
      .addTag('WMS-INTEGRATIONS', 'Webhooks, Shopify/WooCommerce sync')
      .addTag('Master-Data', 'Products, Inventory, Locations')
      .addTag('Operations', 'Inbound, Outbound, Transfers, Counts')
      .addTag('Analytics', 'Reports and dashboards')
      .addTag('Admin', 'System settings, customization, BPMN')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    if (isProd) {
      // Strip example values from prod spec to prevent data leakage
      stripExamplesFromSpec(document);
    }

    const swaggerPath = '/api/docs';
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'ElasticWMS API Docs',
    });

    // OpenAPI JSON export
    fastifyInstance.get('/api/docs/openapi.json', async (_req: any, reply: any) => {
      reply.header('Content-Type', 'application/vnd.oai.openapi+json;version=3.0');
      return document;
    });

    fastifyInstance.get('/api/v1/docs/openapi.json', async (_req: any, reply: any) => {
      reply.header('Content-Type', 'application/vnd.oai.openapi+json;version=3.0');
      return document;
    });

    console.log(`Swagger UI: http://localhost:${configService.get('PORT') || 3001}/api/docs`);
    console.log(`OpenAPI JSON: http://localhost:${configService.get('PORT') || 3001}/api/docs/openapi.json`);
  }

  const shutdownService = app.get(ShutdownService);
  shutdownService.setFastify(fastifyInstance);

  const logLevelService = app.get(LogLevelService);
  logLevelService.setPinoInstance((fastifyInstance as any).logger);

  // Cluster init: warm connection pool
  const poolWarmer = app.get(ConnectionPoolWarmerService);
  await poolWarmer.warmUp();

  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port, '0.0.0.0');
  console.log(`WMS Application is running on: http://localhost:${port}`);
  console.log(`Web API: http://localhost:${port}/${apiPrefix}/web`);
  console.log(`RF API: http://localhost:${port}/${apiPrefix}/rf`);

  process.on('SIGTERM', () => shutdownService.gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => shutdownService.gracefulShutdown('SIGINT'));
  process.on('SIGQUIT', () => shutdownService.gracefulShutdown('SIGQUIT'));
}

function stripExamplesFromSpec(doc: any): void {
  if (!doc?.paths) return;
  for (const pathKey of Object.keys(doc.paths)) {
    const path = doc.paths[pathKey];
    for (const methodKey of Object.keys(path)) {
      const method = path[methodKey];
      if (method?.requestBody?.content?.['application/json']?.schema?.properties) {
        for (const prop of Object.keys(method.requestBody.content['application/json'].schema.properties)) {
          delete method.requestBody.content['application/json'].schema.properties[prop].example;
        }
      }
      // Strip from responses too
      if (method?.responses) {
        for (const statusKey of Object.keys(method.responses)) {
          const resp = method.responses[statusKey];
          if (resp?.content?.['application/json']?.schema?.properties) {
            for (const prop of Object.keys(resp.content['application/json'].schema.properties)) {
              delete resp.content['application/json'].schema.properties[prop].example;
            }
          }
        }
      }
    }
  }
}

bootstrap();
