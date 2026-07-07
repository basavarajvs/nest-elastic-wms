import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntityMappingService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: string) {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM external_entity_mappings WHERE tenant_id = $1::uuid AND mapping_id = $2::uuid`,
      tenantId,
      id,
    );
    return { count: result };
  }

  async create(tenantId: string, dto: any) {
    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO external_entity_mappings
         (tenant_id, platform, external_entity_type, external_entity_id, wms_entity_type, wms_entity_id, metadata, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6::bigint, $7::jsonb, NOW(), NOW())
       ON CONFLICT (tenant_id, platform, external_entity_type, external_entity_id)
       DO UPDATE SET wms_entity_type = EXCLUDED.wms_entity_type, wms_entity_id = EXCLUDED.wms_entity_id,
                     metadata = EXCLUDED.metadata, updated_at = NOW()
       RETURNING *`,
      tenantId,
      dto.platform,
      dto.external_entity_type,
      dto.external_entity_id,
      dto.wms_entity_type,
      BigInt(dto.wms_entity_id),
      JSON.stringify(dto.metadata || {}),
    );
    return result[0];
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
      `SELECT COUNT(*) AS total FROM external_entity_mappings ${where}`,
      ...params,
    );

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM external_entity_mappings ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return { data: rows, total: Number(count[0]?.total || 0), page, limit };
  }

  async findByExternal(tenantId: string, platform: string, externalEntityType: string, externalEntityId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM external_entity_mappings
       WHERE tenant_id = $1::uuid AND platform = $2 AND external_entity_type = $3 AND external_entity_id = $4
       LIMIT 1`,
      tenantId,
      platform,
      externalEntityType,
      externalEntityId,
    );
    return rows.length ? rows[0] : null;
  }

  async findByWms(tenantId: string, platform: string, wmsEntityType: string, wmsEntityId: bigint) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM external_entity_mappings
       WHERE tenant_id = $1::uuid AND platform = $2 AND wms_entity_type = $3 AND wms_entity_id = $4::bigint`,
      tenantId,
      platform,
      wmsEntityType,
      wmsEntityId,
    );
    return rows;
  }
}
