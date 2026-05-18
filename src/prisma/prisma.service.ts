import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { TenantContextService } from '../common/context/tenant-context.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly tenantContext: TenantContextService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log('Database connected');
    }

    this.$use(async (params: any, next: (params: any) => Promise<any>) => {
      const store = this.tenantContext.get();
      const model = params.model;
      const requiresIsolation = model ? this.hasTenantId(model) : false;

      if (!requiresIsolation) {
        return next(params);
      }

      if (store?.isSystemContext) {
        return next(params);
      }

      if (!store || !store.tenantId) {
        if (!store && process.env.NODE_ENV !== 'test') {
          throw new InternalServerErrorException(
            'Tenant context required for this operation',
          );
        }
        return next(params);
      }

      const tenantId = store.tenantId;

      await this.$executeRawUnsafe(
        `SET LOCAL app.tenant_id = '${tenantId}'`,
      );

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

      return next(params);
    });
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
      await tx.$executeRawUnsafe(
        `SET LOCAL app.tenant_id = '${tenantId}'`,
      );
      try {
        return await fn(tx as unknown as PrismaService);
      } finally {
        await tx.$executeRawUnsafe(`RESET app.tenant_id`);
      }
    });
  }
}
