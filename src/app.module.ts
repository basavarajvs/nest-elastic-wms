import { Module, MiddlewareConsumer, NestModule, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { validationSchema } from './config/app.config';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
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
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUOTA_SYNC_QUEUE,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    QuotaSyncRetryProcessor,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
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
  }
}
