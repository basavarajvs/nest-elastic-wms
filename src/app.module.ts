import { Module, MiddlewareConsumer, NestModule, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/cache/redis.module';
import { CoreClientModule } from './core-client/core-client.module';
import { QuotaModule } from './quota/quota.module';
import { QuotaSyncRetryProcessor } from './quota/quota-sync-retry.processor';
import { QUOTA_SYNC_QUEUE } from './quota/quota-sync.constants';
import { CaslModule } from './casl/casl.module';
import { SeedModule } from './seed/seed.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { RfSessionModule } from './rf/rf.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './master-data/products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { InboundModule } from './inbound/inbound.module';
import { LpnModule } from './warehouse/lpn/lpn.module';
import { PurchaseOrderModule } from './inbound/purchase-orders/purchase-order.module';
import { CustomerReturnModule } from './inbound/customer-returns/customer-return.module';
import { LoadModule } from './outbound/loads/load.module';
import { CarrierModule } from './master-data/carriers/carrier.module';
import { BrandModule } from './master-data/brands/brand.module';
import { CategoryModule } from './master-data/categories/category.module';
import { VendorModule } from './master-data/vendors/vendor.module';
import { ClientModule } from './master-data/clients/client.module';
import { CustomersModule } from './master-data/customers/customers.module';
import { InventoryReservationsModule } from './inventory/inventory-reservations/inventory-reservations.module';
import { ShippingLabelsModule } from './outbound/shipping-labels/shipping-labels.module';
import { ProductPackagingModule } from './master-data/product-packaging/product-packaging.module';
import { ProductSuppliersModule } from './master-data/product-suppliers/product-suppliers.module';
import { ProductClientAssignmentsModule } from './master-data/product-client-assignments/product-client-assignments.module';
import { ExceptionManagementModule } from './master-data/exception-management/exception-management.module';
import { LoadingDocksModule } from './outbound/loading-docks/loading-docks.module';
import { NonConformanceReportsModule } from './quality/non-conformance-reports/non-conformance-reports.module';
import { QualityInspectionsModule } from './quality/quality-inspections/quality-inspections.module';
import { ComplianceModule } from './quality/compliance/compliance.module';
import { VasExecutionModule } from './outbound/vas-execution/vas-execution.module';
import { VasCatalogModule } from './outbound/vas-catalog/vas-catalog.module';
import { CarrierRateShoppingModule } from './outbound/carrier-rate-shopping/carrier-rate-shopping.module';
import { OutboundModule } from './outbound/outbound.module';
import { PackingStationsModule } from './outbound/packing-stations/packing-stations.module';
import { TransfersModule } from './transfers/transfers.module';
import { CycleCountModule } from './inventory/counts/counts.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CustomizationModule } from './customization/customization.module';
import { NotificationModule } from './notifications/notification.module';
import { ReportsModule } from './reports/reports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ScannerModule } from './scanner/scanner.module';
import { ObservabilityModule } from './observability/observability.module';
import { ClusterModule } from './cluster/cluster.module';
import { SecurityModule } from './security/security.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { ReplenishmentModule } from './inventory/replenishment/replenishment.module';
import { HierarchyModule } from './warehouse/hierarchy/hierarchy.module';
import { AllocationRulesModule } from './inventory/allocation-rules/allocation-rules.module';
import { BillingModule } from './billing/billing.module';
import { DockYardModule } from './outbound/dock-yard/dock-yard.module';
import { LaborModule } from './labor/labor.module';
import { EquipmentModule } from './equipment/equipment.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { validationSchema } from './config/app.config';
import { ShutdownDrainMiddleware } from './common/middleware/shutdown-drain.middleware';
import { TraceContextMiddleware } from './observability/trace-context.middleware';
import { Rfc7807ExceptionFilter } from './common/filters/rfc7807-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PiiRedactorInterceptor } from './common/interceptors/pii-redactor.interceptor';
import { RequestSemaphoreInterceptor } from './common/interceptors/request-semaphore.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
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
    LpnModule,
    PurchaseOrderModule,
    CustomerReturnModule,
    LoadModule,
    CarrierModule,
    BrandModule,
    CategoryModule,
    VendorModule,
    ClientModule,
    CustomersModule,
    InventoryReservationsModule,
    ShippingLabelsModule,
    ProductPackagingModule,
    ProductSuppliersModule,
    ProductClientAssignmentsModule,
    ExceptionManagementModule,
    LoadingDocksModule,
    NonConformanceReportsModule,
    QualityInspectionsModule,
    ComplianceModule,
    VasExecutionModule,
    VasCatalogModule,
    CarrierRateShoppingModule,
    OutboundModule,
    PackingStationsModule,
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
    LifecycleModule,
    ReplenishmentModule,
    HierarchyModule,
    AllocationRulesModule,
    BillingModule,
    DockYardModule,
    LaborModule,
    EquipmentModule,
    WorkOrdersModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    QuotaSyncRetryProcessor,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
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
    consumer.apply(ShutdownDrainMiddleware).forRoutes('*path');
    consumer.apply(TraceContextMiddleware).forRoutes('*path');
  }
}
