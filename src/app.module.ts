import { Module, MiddlewareConsumer, NestModule, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/cache/redis.module';
import { CoreClientModule } from './core-client/core-client.module';
import { QuotaModule } from './quota/quota.module';
import { QuotaSyncRetryProcessor, QUOTA_SYNC_QUEUE } from './quota/quota-sync-retry.processor';
import { CaslModule } from './casl/casl.module';
import { SeedModule } from './seed/seed.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { RfSessionModule } from './rf/rf.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { InboundModule } from './inbound/inbound.module';
import { OutboundModule } from './outbound/outbound.module';
import { TransfersModule } from './transfers/transfers.module';
import { CycleCountModule } from './counts/counts.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CustomizationModule } from './customization/customization.module';
import { NotificationModule } from './notifications/notification.module';
import { ReportsModule } from './reports/reports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ScannerModule } from './scanner/scanner.module';
import { ObservabilityModule } from './observability/observability.module';
import { ClusterModule } from './cluster/cluster.module';
import { SecurityModule } from './security/security.module';
import { ShutdownService } from './lifecycle/shutdown.service';
import { validationSchema } from './config/app.config';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { ShutdownDrainMiddleware } from './common/middleware/shutdown-drain.middleware';
import { TraceContextMiddleware } from './observability/trace-context.middleware';
import { Rfc7807ExceptionFilter } from './common/filters/rfc7807-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PiiRedactorInterceptor } from './common/interceptors/pii-redactor.interceptor';
import { RequestSemaphoreInterceptor } from './common/interceptors/request-semaphore.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validatePermissionRegistry } from './casl/permission-registry.bootstrap';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: true },
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 5000 },
        },
        limiter: { max: 50, duration: 5000, groupKey: 'tenantId' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUOTA_SYNC_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 300000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800, count: 5000 },
      },
    }),
    PrismaModule,
    RedisModule,
    CoreClientModule,
    QuotaModule,
    CaslModule,
    SeedModule,
    WarehouseModule,
    RfSessionModule,
    HealthModule,
    ProductsModule,
    InventoryModule,
    InboundModule,
    OutboundModule,
    TransfersModule,
    CycleCountModule,
    ApprovalsModule,
    CustomizationModule,
    NotificationModule,
    ReportsModule,
    IntegrationsModule,
    ScannerModule,
    ObservabilityModule,
    ClusterModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    QuotaSyncRetryProcessor,
    ShutdownService,
    {
      provide: APP_FILTER,
      useClass: Rfc7807ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PiiRedactorInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestSemaphoreInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  onModuleInit() {
    try {
      validatePermissionRegistry();
    } catch (err: any) {
      this.logger.error(`Permission registry validation FAILED: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolutionMiddleware).forRoutes('*path');
    consumer.apply(ShutdownDrainMiddleware).forRoutes('*path');
    consumer.apply(TraceContextMiddleware).forRoutes('*path');
  }
}
