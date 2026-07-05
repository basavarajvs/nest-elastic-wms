import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HeatmapService {
  constructor(private readonly prisma: PrismaService) {}

  async getPickHeatmap(tenantId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.facilityId) {
      conditions.push(`facility_id = $${idx}::bigint`);
      params.push(BigInt(query.facilityId));
      idx++;
    }
    if (query.zoneId) {
      conditions.push(`zone_id = $${idx}::bigint`);
      params.push(BigInt(query.zoneId));
      idx++;
    }
    if (query.dateFrom) {
      conditions.push(`analysis_date >= $${idx}::date`);
      params.push(query.dateFrom);
      idx++;
    }
    if (query.dateTo) {
      conditions.push(`analysis_date <= $${idx}::date`);
      params.push(query.dateTo);
      idx++;
    }
    if (query.densityClass) {
      conditions.push(`density_class = $${idx}`);
      params.push(query.densityClass);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const table = 'multitenant.location_pick_heatmap';

    const countResult = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COUNT(*) AS total FROM ${table} ${where}`,
      ...params,
    );

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM ${table} ${where}
       ORDER BY pick_density_score DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return { data: rows, total: Number(countResult[0]?.total || 0), page, limit };
  }

  async getTopLocations(tenantId: string, limitQty: number = 20) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT
         location_id,
         location_code,
         zone_id,
         SUM(total_picks) AS total_picks,
         SUM(total_quantity_picked) AS total_quantity_picked,
         AVG(pick_density_score) AS avg_density_score,
         MAX(analysis_date) AS last_analysis_date
       FROM multitenant.location_pick_heatmap
       WHERE tenant_id = $1::uuid
       GROUP BY location_id, location_code, zone_id
       ORDER BY total_picks DESC
       LIMIT $2`,
      tenantId,
      limitQty,
    );
    return rows;
  }
}
