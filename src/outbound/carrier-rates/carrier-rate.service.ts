import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CarrierRateService {
  private readonly logger = new Logger(CarrierRateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.$executeRawUnsafe(
      `DELETE FROM carrier_rates WHERE id = $2 AND tenant_id = $1`,
      tenantId, id,
    );
  }

  async create(tenantId: string, dto: any) {
    const [row] = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO carrier_rates (tenant_id, carrier_code, carrier_name, service_level, zone, weight_min, weight_max, base_rate, rate_per_unit, transit_days, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      tenantId,
      dto.carrier_code,
      dto.carrier_name,
      dto.service_level,
      dto.zone,
      dto.weight_min ?? 0,
      dto.weight_max ?? 999999,
      dto.base_rate ?? 0,
      dto.rate_per_unit ?? 0,
      dto.transit_days ?? 1,
      dto.currency ?? 'USD',
    );
    return row;
  }

  async findAll(tenantId: string, query: any) {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (query.carrierCode) {
      conditions.push(`carrier_code = $${paramIndex++}`);
      params.push(query.carrierCode);
    }
    if (query.serviceLevel) {
      conditions.push(`service_level = $${paramIndex++}`);
      params.push(query.serviceLevel);
    }
    if (query.zone) {
      conditions.push(`zone = $${paramIndex++}`);
      params.push(query.zone);
    }

    const whereClause = conditions.join(' AND ');
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM carrier_rates WHERE ${whereClause} ORDER BY carrier_code, zone, weight_min LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        ...params, limit, offset,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) as total FROM carrier_rates WHERE ${whereClause}`,
        ...params,
      ),
    ]);

    const total = Number(countResult[0]?.total || 0);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const [row] = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM carrier_rates WHERE tenant_id = $1 AND id = $2`,
      tenantId, id,
    );
    if (!row) throw new NotFoundException('Carrier rate not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields: Record<string, string> = {
      carrier_code: 'carrier_code',
      carrier_name: 'carrier_name',
      service_level: 'service_level',
      zone: 'zone',
      weight_min: 'weight_min',
      weight_max: 'weight_max',
      base_rate: 'base_rate',
      rate_per_unit: 'rate_per_unit',
      transit_days: 'transit_days',
      currency: 'currency',
    };

    for (const [dtoField, dbColumn] of Object.entries(fields)) {
      if ((dto as any)[dtoField] !== undefined) {
        setClauses.push(`${dbColumn} = $${paramIndex++}`);
        params.push((dto as any)[dtoField]);
      }
    }

    if (!setClauses.length) throw new BadRequestException('No fields to update');

    setClauses.push(`updated_at = NOW()`);
    params.push(tenantId, id);

    const [row] = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE carrier_rates SET ${setClauses.join(', ')} WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex} RETURNING *`,
      ...params,
    );
    return row;
  }

  async shop(tenantId: string, zones: string[], weight: number, serviceLevel?: string) {
    const params: any[] = [tenantId, weight];
    let paramIndex = 3;
    const zonePlaceholders = zones.map(() => `$${paramIndex++}`).join(', ');
    params.push(...zones);

    let serviceFilter = '';
    if (serviceLevel) {
      serviceFilter = `AND service_level = $${paramIndex++}`;
      params.push(serviceLevel);
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT *, (base_rate + (rate_per_unit * GREATEST(0, $2 - weight_min))) AS total_cost
       FROM carrier_rates
       WHERE tenant_id = $1
         AND $2 >= weight_min AND $2 <= weight_max
         AND zone IN (${zonePlaceholders})
         ${serviceFilter}
       ORDER BY total_cost ASC`,
      ...params,
    );

    if (!rows.length) {
      return { cheapest: null, fastest: null, all: [] };
    }

    const cheapest = rows.reduce((a, b) => Number(a.total_cost) < Number(b.total_cost) ? a : b);
    const fastest = rows.reduce((a, b) => (a.transit_days ?? 99) < (b.transit_days ?? 99) ? a : b);

    return { cheapest, fastest, all: rows };
  }
}
