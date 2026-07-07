import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalThresholdService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(tenantId: string) {
    return this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT c.*, f.facility_name FROM multitenant.approval_threshold_configs c
       LEFT JOIN multitenant.warehouse_facilities f ON f.tenant_id = c.tenant_id AND f.facility_id = c.facility_id
       WHERE c.tenant_id = $1::uuid AND c.active = true
       ORDER BY c.applied_at DESC LIMIT 1`,
      tenantId,
    );
  }

  async upsert(tenantId: string, dto: any) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO multitenant.approval_threshold_configs
        (tenant_id, version, auto_threshold, supervisor_threshold, manager_threshold, active, applied_at)
       VALUES ($1::uuid, $2, $3, $4, $5, true, NOW())
       ON CONFLICT (tenant_id, version) DO UPDATE
       SET auto_threshold = $3, supervisor_threshold = $4, manager_threshold = $5, applied_at = NOW()`,
      tenantId,
      dto.version || 'v1',
      dto.auto_threshold ?? 100,
      dto.supervisor_threshold ?? 1000,
      dto.manager_threshold ?? 10000,
    );
  }
}
