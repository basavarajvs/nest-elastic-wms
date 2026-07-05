import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalThresholdService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(tenantId: string) {
    return this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.approval_threshold_configs
       WHERE tenant_id = $1::uuid AND active = true
       ORDER BY applied_at DESC LIMIT 1`,
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
      dto.autoThreshold ?? 100,
      dto.supervisorThreshold ?? 1000,
      dto.managerThreshold ?? 10000,
    );
  }
}
