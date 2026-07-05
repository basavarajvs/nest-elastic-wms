import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientRateService {
  private readonly logger = new Logger(ClientRateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const sql = `
      INSERT INTO multitenant.storage_client_rates
        (tenant_id, rate_master_id, client_id, rate_per_unit, rate_currency, effective_from, effective_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql,
      tenantId,
      dto.rateMasterId || null,
      dto.clientId || null,
      dto.ratePerUnit || null,
      dto.rateCurrency || 'USD',
      dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
      dto.effectiveTo ? new Date(dto.effectiveTo) : null,
    );
    return rows[0];
  }

  async findAll(tenantId: string, query: any) {
    let sql = `SELECT * FROM multitenant.storage_client_rates WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIdx = 2;
    if (query.rateMasterId) {
      sql += ` AND rate_master_id = $${paramIdx++}`;
      params.push(query.rateMasterId);
    }
    if (query.clientId) {
      sql += ` AND client_id = $${paramIdx++}`;
      params.push(query.clientId);
    }
    sql += ` ORDER BY effective_from DESC`;
    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  async findById(tenantId: string, id: string) {
    const sql = `SELECT * FROM multitenant.storage_client_rates WHERE id = $1 AND tenant_id = $2`;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, id, tenantId);
    if (!rows.length) throw new NotFoundException('Client rate not found');
    return rows[0];
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (dto.rateMasterId !== undefined) {
      sets.push(`rate_master_id = $${paramIdx++}`);
      params.push(dto.rateMasterId);
    }
    if (dto.clientId !== undefined) {
      sets.push(`client_id = $${paramIdx++}`);
      params.push(dto.clientId);
    }
    if (dto.ratePerUnit !== undefined) {
      sets.push(`rate_per_unit = $${paramIdx++}`);
      params.push(dto.ratePerUnit);
    }
    if (dto.rateCurrency !== undefined) {
      sets.push(`rate_currency = $${paramIdx++}`);
      params.push(dto.rateCurrency);
    }
    if (dto.effectiveFrom !== undefined) {
      sets.push(`effective_from = $${paramIdx++}`);
      params.push(new Date(dto.effectiveFrom));
    }
    if (dto.effectiveTo !== undefined) {
      sets.push(`effective_to = $${paramIdx++}`);
      params.push(dto.effectiveTo ? new Date(dto.effectiveTo) : null);
    }

    if (!sets.length) return this.findById(tenantId, id);

    const sql = `UPDATE multitenant.storage_client_rates SET ${sets.join(', ')} WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1} RETURNING *`;
    params.push(id, tenantId);
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
    if (!rows.length) throw new NotFoundException('Client rate not found');
    return rows[0];
  }

  async findByRateMasterAndClient(tenantId: string, rateMasterId: string, clientId: string) {
    const sql = `
      SELECT * FROM multitenant.storage_client_rates
      WHERE tenant_id = $1 AND rate_master_id = $2 AND client_id = $3
    `;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, tenantId, rateMasterId, clientId);
    return rows.length ? rows[0] : null;
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.storage_client_rates WHERE tenant_id = $1::uuid AND id = $2::uuid`,
      tenantId, id,
    );
  }
}
