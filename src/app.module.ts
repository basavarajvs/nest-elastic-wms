import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CaslModule } from './casl/casl.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './common/cache/redis.module';
import { ContextModule } from './common/context/context.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { MasterDataModule } from './master-data/master-data.module';
import { InventoryModule } from './inventory/inventory.module';
import { InboundModule } from './inbound/inbound.module';
import { OutboundModule } from './outbound/outbound.module';
import { AuditModule } from './common/audit/audit.module';
import { RfModule } from './rf/rf.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { QualityModule } from './quality/quality.module';
import { LaborModule } from './labor/labor.module';
import { EquipmentModule } from './equipment/equipment.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { ExceptionsModule } from './exceptions/exceptions.module';
import { TransfersModule } from './transfers/transfers.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WorkflowModule } from './workflow/workflow.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { DockYardModule } from './dock-yard/dock-yard.module';
import { BillingModule } from './billing/billing.module';
import { SettingsModule } from './settings/settings.module';
import { ReportsModule } from './reports/reports.module';
import { SecurityModule } from './security/security.module';
import { ObservabilityModule } from './observability/observability.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CoreClientModule } from './core-client/core-client.module';
import { QuotaModule } from './quota/quota.module';
import { SeedModule } from './seed/seed.module';
import { ClusterModule } from './cluster/cluster.module';
import { EventsModule } from './events/events.module';
import { appValidationSchema } from './config/app.config';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { JwtValidationService } from './common/auth/jwt-validation.service';
import { CaslGuard } from './common/guards/casl.guard';
import { QuotaGuard } from './common/guards/quota.guard';
import { Rfc7807ExceptionFilter } from './common/filters/rfc7807-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PiiRedactorInterceptor } from './common/interceptors/pii-redactor.interceptor';
import { RequestSemaphoreInterceptor } from './common/interceptors/request-semaphore.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AuditInterceptor } from './observability/audit/audit.interceptor';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { ShutdownDrainMiddleware } from './lifecycle/shutdown-drain.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
        limiter: { max: 50, duration: 5000 },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CaslModule,
    RedisModule,
    ContextModule,
    AuditModule,
    RfModule,
    LifecycleModule,
    HealthModule,
    InventoryModule,
    WarehouseModule,
    MasterDataModule,
    InboundModule,
    OutboundModule,
    QualityModule,
    LaborModule,
    EquipmentModule,
    WorkOrdersModule,
    ExceptionsModule,
    TransfersModule,
    IntegrationsModule,
    WorkflowModule,
    FulfillmentModule,
    DockYardModule,
    BillingModule,
    SettingsModule,
    ReportsModule,
    SecurityModule,
    ObservabilityModule,
    AnalyticsModule,
    CoreClientModule,
    QuotaModule,
    SeedModule,
    ClusterModule,
    EventsModule,
  ],
  providers: [
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CaslGuard },
    { provide: APP_GUARD, useClass: QuotaGuard },
    { provide: APP_FILTER, useClass: Rfc7807ExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: PiiRedactorInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestSemaphoreInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  onApplicationBootstrap() {
    const { WMS_ROLE_DEFINITIONS, ALL_WMS_SUBJECTS } = require('./casl/permission-registry');
    const subjectSet = new Set(ALL_WMS_SUBJECTS);
    const missingSubjects: string[] = [];
    for (const role of WMS_ROLE_DEFINITIONS) {
      for (const perm of role.permissions) {
        if (typeof perm === 'object' && perm.subject && !subjectSet.has(perm.subject)) {
          missingSubjects.push(perm.subject);
        }
      }
    }
    if (missingSubjects.length > 0) {
      this.logger.warn(`Missing CASL subjects in ALL_WMS_SUBJECTS: [${[...new Set(missingSubjects)].join(', ')}]`);
    } else {
      this.logger.log('All CASL subjects validated successfully');
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolutionMiddleware, ShutdownDrainMiddleware).forRoutes('*');
  }
}
