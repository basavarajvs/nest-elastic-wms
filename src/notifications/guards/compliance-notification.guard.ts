import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';
import {
  WmsNotificationType,
  COMPLIANCE_OVERRIDE_TYPES,
} from '../wms-notification.types';

const AUDIT_OVERRIDE_KEY = 'wms:audit:compliance:override:';

@Injectable()
export class ComplianceNotificationGuard {
  private readonly logger = new Logger(ComplianceNotificationGuard.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  isComplianceType(type: string): boolean {
    return COMPLIANCE_OVERRIDE_TYPES.has(type as WmsNotificationType);
  }

  getForceDeliveryRoleCodes(type: string): string[] {
    if (!this.isComplianceType(type)) return [];
    return ['WAREHOUSE_ADMIN', 'TENANT_ADMIN'];
  }

  async logOverride(
    type: string,
    tenantId: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const entry = {
      event: 'preference.override.compliance',
      notificationType: type,
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      ...(metadata || {}),
    };

    const key = `${AUDIT_OVERRIDE_KEY}${tenantId}`;
    await this.redis.lpush(key, JSON.stringify(entry));
    await this.redis.ltrim(key, 0, 499);
    await this.redis.expire(key, 604800);

    this.eventEmitter.emit('compliance.override.logged', entry);

    this.logger.warn(
      `Compliance override for ${type} (user: ${userId}, tenant: ${tenantId})`,
    );
  }

  async getOverrideLog(
    tenantId: string,
    limit = 100,
  ): Promise<Record<string, any>[]> {
    const key = `${AUDIT_OVERRIDE_KEY}${tenantId}`;
    const raw = await this.redis.lrange(key, 0, limit - 1);
    return raw.map((r) => JSON.parse(r));
  }
}
