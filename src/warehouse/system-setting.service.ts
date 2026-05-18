import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisPubSubService } from '../cluster/redis-pubsub.service';

@Injectable()
export class SystemSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  async list(tenantId: string) {
    return (this.prisma as any).systemSetting.findMany({
      where: { tenantId },
      orderBy: { settingKey: 'asc' },
      select: { id: true, settingKey: true, value: true, description: true, updatedAt: true },
    });
  }

  async get(tenantId: string, settingKey: string) {
    const setting = await (this.prisma as any).systemSetting.findFirst({
      where: { tenantId, settingKey },
    });
    if (!setting) throw new NotFoundException(`Setting '${settingKey}' not found`);
    return setting;
  }

  async upsert(tenantId: string, settingKey: string, value: any, description?: string, updatedBy?: string) {
    const old = await (this.prisma as any).systemSetting.findFirst({
      where: { tenantId, settingKey },
    });

    const setting = await (this.prisma as any).$transaction(async (tx: any) => {
      const s = await tx.systemSetting.upsert({
        where: { multitenant_system_setting_uq_tenant_setting_key: { tenantId, settingKey } },
        create: { tenantId, settingKey, value, description, updatedBy },
        update: { value, description, updatedBy },
      });

      await tx.systemSettingHistory.create({
        data: {
          tenantId,
          settingKey,
          oldValue: old?.value || null,
          newValue: value,
          changedBy: updatedBy,
        },
      });

      return s;
    });

    await this.redisPubSub.publish('wms:config:changed', {
      tenantId,
      settingKey,
      oldValue: old?.value,
      newValue: value,
      changedBy: updatedBy,
    });

    return setting;
  }

  async delete(tenantId: string, settingKey: string) {
    const setting = await (this.prisma as any).systemSetting.findFirst({
      where: { tenantId, settingKey },
    });
    if (!setting) throw new NotFoundException(`Setting '${settingKey}' not found`);

    await (this.prisma as any).systemSetting.delete({ where: { id: setting.id } });
    return { deleted: true };
  }
}
