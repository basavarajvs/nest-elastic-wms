import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId?: string;
    action: string;
    tableName: string;
    recordId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    sessionId?: string;
    ipAddress?: string;
    notes?: string;
  }) {
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO multitenant.system_audit_log
          (tenant_id, action, table_name, record_id, user_id, session_id, ip_address,
           old_values_json, new_values_json, changes_summary_json, notes)
         VALUES ($1::uuid, $2, $3, $4::bigint, $5::uuid, $6, $7::inet, $8, $9, $10, $11)`,
        params.tenantId,
        params.action,
        params.tableName,
        params.recordId ? BigInt(params.recordId.replace(/\D/g, '') || '0') : null,
        params.userId || null,
        params.sessionId || null,
        params.ipAddress || null,
        params.oldValue ? JSON.stringify(params.oldValue) : null,
        params.newValue ? JSON.stringify(params.newValue) : null,
        this.computeChanges(params.oldValue, params.newValue),
        params.notes || null,
      );
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${err}`);
    }
  }

  async findAll(tenantId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const conditions: string[] = ['tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.action) {
      conditions.push(`action = $${idx}`);
      params.push(query.action);
      idx++;
    }
    if (query.tableName) {
      conditions.push(`table_name = $${idx}`);
      params.push(query.tableName);
      idx++;
    }
    if (query.userId) {
      conditions.push(`user_id = $${idx}::uuid`);
      params.push(query.userId);
      idx++;
    }
    if (query.dateFrom) {
      conditions.push(`action_timestamp >= $${idx}::timestamptz`);
      params.push(query.dateFrom);
      idx++;
    }
    if (query.dateTo) {
      conditions.push(`action_timestamp <= $${idx}::timestamptz`);
      params.push(query.dateTo);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COUNT(*) AS total FROM multitenant.system_audit_log ${where}`, ...params,
    );
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_audit_log ${where}
       ORDER BY action_timestamp DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params, limit, (page - 1) * limit,
    );
    return { data: rows, total: Number(countResult[0]?.total || 0), page, limit };
  }

  async delete(tenantId: string, id: bigint) {
    const entity = await this.findById(tenantId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.system_audit_log WHERE audit_log_id = $2::bigint AND tenant_id = $1::uuid`,
      tenantId, id,
    );
    return entity;
  }

  async findById(tenantId: string, id: bigint) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_audit_log
       WHERE tenant_id = $1::uuid AND audit_log_id = $2::bigint`,
      tenantId, id,
    );
    return rows.length ? rows[0] : null;
  }

  private computeChanges(
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
  ): string | null {
    if (!oldValue || !newValue) return null;
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key of Object.keys(newValue)) {
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        changes[key] = { from: oldValue[key], to: newValue[key] };
      }
    }
    return Object.keys(changes).length > 0 ? JSON.stringify(changes) : null;
  }
}
