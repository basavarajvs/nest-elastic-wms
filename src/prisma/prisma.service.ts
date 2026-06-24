import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { TenantContextService } from '../common/context/tenant-context.service';
import { trace, context as otelContext } from '@opentelemetry/api';
import { getTracer, traceContextStorage } from '../observability/otel.config';

const SLOW_QUERY_THRESHOLD_MS = 100;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pgbouncerEnabled: boolean;

  constructor(private readonly tenantContext: TenantContextService) {
    super();
    this.pgbouncerEnabled = process.env.PGBOUNCER_ENABLED === 'true';
  }

  private async setTenantContext(tenantId: string): Promise<void> {
    await this.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);
  }

  private async resetTenantContext(): Promise<void> {
    await this.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', true)`).catch(() => {});
  }

  async onModuleInit() {
    await this.$connect();
    if (this.pgbouncerEnabled) {
      this.logger.log('PgBouncer mode: wrapping all tenant queries in $transaction');
    }
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('Database connected');
    }

    this.$use(async (params: any, next: (params: any) => Promise<any>) => {
      const store = this.tenantContext.get();
      const model = params.model;
      const requiresIsolation = model ? this.hasTenantId(model) : false;

      const span = getTracer().startSpan('prisma.query', {
        attributes: {
          'db.system': 'postgresql',
          'db.model': model || 'raw',
          'db.operation': params.action || 'executeRaw',
          'tenant_id': store?.tenantId || 'unknown',
        },
      });

      const start = Date.now();

      try {
        if (!requiresIsolation) {
          const result = await next(params);
          return result;
        }

        if (store?.isSystemContext) {
          const result = await next(params);
          return result;
        }

        if (!store || !store.tenantId) {
          if (!store && process.env.NODE_ENV !== 'test') {
            throw new InternalServerErrorException(
              'Tenant context required for this operation',
            );
          }
          const result = await next(params);
          return result;
        }

        const tenantId = store.tenantId;

        if (
          params.action === 'findUnique' ||
          params.action === 'findFirst' ||
          params.action === 'findMany' ||
          params.action === 'count' ||
          params.action === 'aggregate'
        ) {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'create') {
          params.args.data = { ...params.args.data, tenantId };
        } else if (params.action === 'createMany') {
          const data = params.args.data as any[];
          if (Array.isArray(data)) {
            params.args.data = data.map((d: any) => ({ ...d, tenantId }));
          }
        } else if (
          params.action === 'update' ||
          params.action === 'updateMany' ||
          params.action === 'upsert'
        ) {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'delete' || params.action === 'deleteMany') {
          params.args.where = { ...params.args.where, tenantId };
        }

        if (this.pgbouncerEnabled) {
          return this.$transaction(async (tx: any) => {
            await tx.$executeRawUnsafe(
              `SELECT set_config('app.tenant_id', $1, true)`,
              tenantId,
            );
            const result = await next(params);
            return result;
          });
        }

        await this.setTenantContext(tenantId).catch(() => {
          throw new InternalServerErrorException('Failed to set tenant context');
        });

        try {
          const result = await next(params);
          return result;
        } finally {
          await this.resetTenantContext();
        }
      } finally {
        this.recordQuery(model, params.action, store?.tenantId, start, span);
      }
    });
  }

  private recordQuery(
    model: string,
    action: string,
    tenantId: string | undefined,
    start: number,
    span: any,
  ): void {
    const duration = Date.now() - start;
    span.setAttribute('duration_ms', duration);
    span.end();

    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      this.logger.warn(`Slow query detected: ${model}.${action} (${duration}ms)`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private hasTenantId(model: string): boolean {
    const wmsModels = [
      'ResourceQuota',
      'WarehouseFacility',
      'WarehouseZone',
      'StorageLocation',
      'Customer',
      'ClientFacilityAssignment',
      'InventoryAllocationRule',
      'InventoryAllocationRuleConstraint',
      'InventoryAllocationRuleLocation',
      'PackingSession',
      'PackingContainer',
      'PackingSessionStatusHistory',
      'ShipmentStatusHistory',
      'LpnTransaction',
      'CountAccuracyHistory',
      'CycleCountMetrics',
    ];
    return wmsModels.includes(model);
  }

  async withTenant<T>(
    tenantId: string,
    fn: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.tenantContext.run(
      {
        tenantId,
        tenantCode: '',
        tenantStatus: 'active',
        isSystemContext: false,
      },
      () => fn(this),
    );
  }

  async withTransaction<T>(
    tenantId: string,
    fn: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx: PrismaClient) => {
      if (this.pgbouncerEnabled) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.tenant_id', $1, true)`,
          tenantId,
        );
      } else {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = $1`, tenantId);
      }
      try {
        return await fn(tx as unknown as PrismaService);
      } finally {
        if (!this.pgbouncerEnabled) {
          await tx.$executeRawUnsafe(`RESET app.tenant_id`).catch(() => {});
        }
      }
    });
  }
}
