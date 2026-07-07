import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AsnImportService {
  private readonly logger = new Logger(AsnImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapJobRow(r: any) {
    const { warehouse_facilities, ...rest } = r;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
  }

  async createJob(tenantId: string, dto: any) {
    const row = await this.prisma.asn_import_jobs.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        job_number: dto.job_number,
        source_system: dto.source_system,
        import_channel: dto.import_channel || 'MANUAL',
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return this.mapJobRow(row);
  }

  async findJobs(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.asn_import_jobs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          warehouse_facilities: { select: { facility_name: true } },
          asn_import_documents: {
            include: { asn_import_results: true },
          },
        },
      }),
      this.prisma.asn_import_jobs.count({ where }),
    ]);
    return { data: data.map(this.mapJobRow), total, page, limit };
  }

  async findJobById(tenantId: string, jobId: bigint) {
    const row = await this.prisma.asn_import_jobs.findFirst({
      where: { tenant_id: tenantId, import_job_id: jobId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        asn_import_documents: {
          include: { asn_import_results: true },
        },
      },
    });
    return row ? this.mapJobRow(row) : null;
  }
}
