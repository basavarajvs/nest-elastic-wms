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
      RETURNING id
    `;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql,
      tenantId,
      dto.rate_master_id || null,
      dto.client_id || null,
      dto.rate_per_unit || null,
      dto.rate_currency || 'USD',
      dto.effective_from ? new Date(dto.effective_from) : new Date(),
      dto.effective_to ? new Date(dto.effective_to) : null,
    );
    return this.findById(tenantId, rows[0].id);
  }

  async findAll(tenantId: string, query: any) {
    let sql = `SELECT scr.*, c.client_name, srm.unit_type AS rate_name FROM multitenant.storage_client_rates scr LEFT JOIN multitenant.clients c ON scr.client_id = c.client_id LEFT JOIN multitenant.storage_rate_master srm ON scr.rate_master_id = srm.rate_id WHERE scr.tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIdx = 2;
    if (query.rateMasterId) {
      sql += ` AND scr.rate_master_id = $${paramIdx++}`;
      params.push(query.rateMasterId);
    }
    if (query.clientId) {
      sql += ` AND scr.client_id = $${paramIdx++}`;
      params.push(query.clientId);
    }
    sql += ` ORDER BY scr.effective_from DESC`;
    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  async findById(tenantId: string, id: string) {
    const sql = `SELECT scr.*, c.client_name, srm.unit_type AS rate_name FROM multitenant.storage_client_rates scr LEFT JOIN multitenant.clients c ON scr.client_id = c.client_id LEFT JOIN multitenant.storage_rate_master srm ON scr.rate_master_id = srm.rate_id WHERE scr.id = $1 AND scr.tenant_id = $2`;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql, id, tenantId);
    if (!rows.length) throw new NotFoundException('Client rate not found');
    return rows[0];
  }

  async update(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (dto.rate_master_id !== undefined) {
      sets.push(`rate_master_id = $${paramIdx++}`);
      params.push(dto.rate_master_id);
    }
    if (dto.client_id !== undefined) {
      sets.push(`client_id = $${paramIdx++}`);
      params.push(dto.client_id);
    }
    if (dto.rate_per_unit !== undefined) {
      sets.push(`rate_per_unit = $${paramIdx++}`);
      params.push(dto.rate_per_unit);
    }
    if (dto.rate_currency !== undefined) {
      sets.push(`rate_currency = $${paramIdx++}`);
      params.push(dto.rate_currency);
    }
    if (dto.effective_from !== undefined) {
      sets.push(`effective_from = $${paramIdx++}`);
      params.push(new Date(dto.effective_from));
    }
    if (dto.effective_to !== undefined) {
      sets.push(`effective_to = $${paramIdx++}`);
      params.push(dto.effective_to ? new Date(dto.effective_to) : null);
    }

    if (!sets.length) return this.findById(tenantId, id);

    const sql = `UPDATE multitenant.storage_client_rates SET ${sets.join(', ')} WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`;
    params.push(id, tenantId);
    await this.prisma.$executeRawUnsafe(sql, ...params);
    return this.findById(tenantId, id);
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
