import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  private hashPayload(payload: any): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async processWebhook(tenantId: string, platform: string, eventType: string, payload: any) {
    const payloadHash = this.hashPayload(payload);

    const existing = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT id FROM sync_webhook_logs
       WHERE tenant_id = $1::uuid AND platform = $2 AND event_type = $3 AND payload_hash = $4
       LIMIT 1`,
      tenantId,
      platform,
      eventType,
      payloadHash,
    );

    if (existing.length) {
      return { deduplicated: true, id: existing[0].id };
    }

    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO sync_webhook_logs (tenant_id, platform, event_type, payload, payload_hash, status, created_at)
       VALUES ($1::uuid, $2, $3, $4::jsonb, $5, 'RECEIVED', NOW())
       RETURNING *`,
      tenantId,
      platform,
      eventType,
      JSON.stringify(payload),
      payloadHash,
    );

    return { deduplicated: false, ...result[0] };
  }

  async findAll(tenantId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const offset = (page - 1) * limit;
    const platform = query.platform;
    let where = `WHERE tenant_id = $1::uuid`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (platform) {
      where += ` AND platform = $${idx}`;
      params.push(platform);
      idx++;
    }

    const count = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COUNT(*) AS total FROM sync_webhook_logs ${where}`,
      ...params,
    );

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM sync_webhook_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return { data: rows, total: Number(count[0]?.total || 0), page, limit };
  }
}
