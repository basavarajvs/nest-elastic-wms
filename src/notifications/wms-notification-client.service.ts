import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { CoreClientService } from '../core-client/core-client.service';
import {
  WmsNotificationType,
  NOTIFICATION_ROLE_MAP,
  COMPLIANCE_OVERRIDE_TYPES,
  validateNotificationVariables,
  NotificationDispatchEvent,
} from './wms-notification.types';

const AUDIT_RING_KEY = 'wms:audit:notifications:';
const RF_UNREAD_PREFIX = 'wms:rf:unread:';
const METRICS_KEY = 'wms:metrics:notifications:';
const DLQ_MAX_ATTEMPTS = 3;

const RF_VISIBLE_TYPES = new Set<string>([
  WmsNotificationType.LOW_STOCK_ALERT,
  WmsNotificationType.STOCKOUT_CRITICAL,
  WmsNotificationType.QC_FAILED,
  WmsNotificationType.RF_SESSION_TIMEOUT,
  WmsNotificationType.PUTAWAY_DELAYED,
]);

@Injectable()
export class WmsNotificationClientService {
  private readonly logger = new Logger(WmsNotificationClientService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue('wms-notifications') private readonly queue: Queue,
    private readonly configService: ConfigService,
    private readonly coreClient: CoreClientService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async dispatch(event: NotificationDispatchEvent): Promise<void> {
    try {
      validateNotificationVariables(event.type, event.variables);
    } catch (err: any) {
      this.logger.warn(`Rejected ${event.type}: ${err.message}`);
      await this.recordAudit(event.tenantId, {
        type: event.type,
        status: 'skipped',
        reason: err.message,
      });
      return;
    }

    const roles = NOTIFICATION_ROLE_MAP[event.type] || [];
    const recipients = event.recipients || [];
    const roleRecipients = roles.map((roleCode) => ({ roleCode }));

    const allRecipients = [...recipients, ...roleRecipients];
    const deduped = this.deduplicate(allRecipients);

    const bypassPreferences =
      event.bypassPreferences ?? COMPLIANCE_OVERRIDE_TYPES.has(event.type);

    await this.queue.add(
      'dispatch',
      {
        type: event.type,
        tenantId: event.tenantId,
        recipients: deduped,
        variables: event.variables,
        priority: event.priority || 'normal',
        bypassPreferences,
        correlationId: event.correlationId || uuidv4(),
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: DLQ_MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    this.logger.debug(
      `Queued ${event.type} for ${deduped.length} recipients (bypassPrefs: ${bypassPreferences})`,
    );
  }

  async handleDispatch(
    payload: NotificationDispatchEvent,
  ): Promise<{ queued: boolean; recipients: number }> {
    const coreUrl = this.configService.get<string>('CORE_API_URL');
    const token = this.configService.get<string>('CORE_API_TOKEN');

    try {
      const response = await this.coreClient.dispatchNotification({
        tenantId: payload.tenantId,
        notificationType: payload.type,
        recipients: payload.recipients,
        variables: payload.variables,
        priority: payload.priority,
        bypassPreferences: payload.bypassPreferences,
      });

      await this.recordAudit(payload.tenantId, {
        type: payload.type,
        status: 'dispatched',
        recipients: payload.recipients.length,
        requestId: response.requestId,
      });

      await this.incrementMetric(payload.tenantId, 'sent');

      if (RF_VISIBLE_TYPES.has(payload.type)) {
        await this.pushToRfUnread(payload);
      }

      return { queued: true, recipients: payload.recipients.length };
    } catch (err: any) {
      this.logger.error(
        `Core dispatch failed for ${payload.type}: ${err.message}`,
      );

      await this.recordAudit(payload.tenantId, {
        type: payload.type,
        status: 'failed',
        error: err.message,
      });

      await this.incrementMetric(payload.tenantId, 'failed');

      throw err;
    }
  }

  private deduplicate(
    recipients: Array<{ userId?: string; roleCode?: string }>,
  ): Array<{ userId?: string; roleCode?: string }> {
    const seen = new Set<string>();
    return recipients.filter((r) => {
      const key = r.userId || r.roleCode || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async recordAudit(
    tenantId: string,
    entry: Record<string, any>,
  ): Promise<void> {
    const key = `${AUDIT_RING_KEY}${tenantId}`;
    const auditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    await this.redis.lpush(key, JSON.stringify(auditEntry));
    await this.redis.ltrim(key, 0, 499);
    await this.redis.expire(key, 86400);

    this.eventEmitter.emit('notification.audit', { tenantId, entry: auditEntry });
  }

  private async pushToRfUnread(payload: NotificationDispatchEvent): Promise<void> {
    for (const recipient of payload.recipients) {
      if (!recipient.userId) continue;
      const key = `${RF_UNREAD_PREFIX}${recipient.userId}:*`;
      const sessions = await this.redis.keys(key);
      for (const sessionKey of sessions) {
        const entry = {
          id: uuidv4(),
          type: payload.type,
          message: payload.type,
          actionRequired: payload.priority === 'immediate',
          createdAt: new Date().toISOString(),
        };
        await this.redis.lpush(sessionKey, JSON.stringify(entry));
        await this.redis.ltrim(sessionKey, 0, 49);
      }
    }
  }

  private async incrementMetric(
    tenantId: string,
    status: string,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${METRICS_KEY}${tenantId}:${today}`;
    await this.redis.hincrby(key, status, 1);
    await this.redis.expire(key, 172800);
  }

  async getMetrics(
    tenantId: string,
    date?: string,
  ): Promise<Record<string, number>> {
    const day = date || new Date().toISOString().split('T')[0];
    const key = `${METRICS_KEY}${tenantId}:${day}`;
    const raw = await this.redis.hgetall(key);
    const result: Record<string, number> = { sent: 0, failed: 0, skipped: 0 };
    for (const [k, v] of Object.entries(raw)) {
      result[k] = parseInt(v, 10) || 0;
    }
    return result;
  }

  async getAuditLog(
    tenantId: string,
    limit = 500,
  ): Promise<Record<string, any>[]> {
    const key = `${AUDIT_RING_KEY}${tenantId}`;
    const raw = await this.redis.lrange(key, 0, limit - 1);
    return raw.map((r) => JSON.parse(r));
  }
}
