import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { OnEvent } from '@nestjs/event-emitter';

const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 30000;

@Injectable()
export class NotificationAuditStreamerService {
  private readonly logger = new Logger(NotificationAuditStreamerService.name);
  private readonly http: AxiosInstance;
  private readonly buffer: Record<string, any[]> = {};

  constructor(
    @InjectQueue('wms-notifications') private readonly queue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.http = axios.create({
      baseURL: this.configService.get<string>('CORE_API_URL'),
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-System-Token': this.configService.get<string>('CORE_API_TOKEN') || '',
      },
    });
  }

  @OnEvent('notification.audit')
  onNotificationAudit(payload: { tenantId: string; entry: Record<string, any> }) {
    if (!this.buffer[payload.tenantId]) {
      this.buffer[payload.tenantId] = [];
    }
    this.buffer[payload.tenantId].push(payload.entry);

    if (this.buffer[payload.tenantId].length >= BATCH_SIZE) {
      this.flush(payload.tenantId).catch((err) =>
        this.logger.error(`Flush failed for ${payload.tenantId}: ${err.message}`),
      );
    }
  }

  @Cron('*/30 * * * * *')
  async scheduledFlush() {
    const tenants = Object.keys(this.buffer);
    for (const tenantId of tenants) {
      if (this.buffer[tenantId].length === 0) continue;
      try {
        await this.flush(tenantId);
      } catch (err: any) {
        this.logger.error(
          `Scheduled flush failed for ${tenantId}: ${err.message}`,
        );
      }
    }
  }

  private async flush(tenantId: string): Promise<void> {
    const batch = this.buffer[tenantId];
    if (!batch || batch.length === 0) return;

    const chunk = batch.splice(0, BATCH_SIZE);
    try {
      await this.http.post('/audit/log', {
        tenantId,
        entries: chunk.map((e) => ({
          eventType: 'notification_event',
          action: e.status === 'dispatched' ? 'create' : 'read',
          eventDescription: `Notification ${e.type}: ${e.status}`,
          resourceType: 'notification',
          resourceId: e.requestId || null,
          userId: null,
          ipAddress: null,
          userAgent: null,
          metadata: e,
        })),
      });
      this.logger.debug(`Streamed ${chunk.length} audit entries for ${tenantId}`);
    } catch (err: any) {
      batch.unshift(...chunk);
      const isServerError =
        err?.response?.status >= 500 || err?.code === 'ECONNREFUSED';
      if (isServerError) {
        await this.queue.add(
          'audit-dlq',
          { tenantId, entries: chunk },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 60000 },
            delay: 3600000,
          },
        );
        this.logger.warn(
          `Moved ${chunk.length} audit entries to DLQ for ${tenantId}`,
        );
      }
    }
  }
}
