import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

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
