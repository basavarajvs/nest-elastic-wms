import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SyncLogService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: string) {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM sync_logs WHERE tenant_id = $1::uuid AND log_id = $2::uuid`,
      tenantId,
      id,
    );
    return { count: result };
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
      `SELECT COUNT(*) AS total FROM sync_logs ${where}`,
      ...params,
    );

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM sync_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return { data: rows, total: Number(count[0]?.total || 0), page, limit };
  }
}
