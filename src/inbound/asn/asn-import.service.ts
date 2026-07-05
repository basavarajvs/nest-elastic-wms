import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AsnImportService {
  private readonly logger = new Logger(AsnImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createJob(tenantId: string, dto: any) {
    return this.prisma.asn_import_jobs.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        job_number: dto.jobNumber,
        source_system: dto.sourceSystem,
        import_channel: dto.importChannel || 'MANUAL',
        created_by: dto.createdBy,
      },
    });
  }

  async findJobs(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.asn_import_jobs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          asn_import_documents: {
            include: { asn_import_results: true },
          },
        },
      }),
      this.prisma.asn_import_jobs.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findJobById(tenantId: string, jobId: bigint) {
    return this.prisma.asn_import_jobs.findFirst({
      where: { tenant_id: tenantId, import_job_id: jobId },
      include: {
        asn_import_documents: {
          include: { asn_import_results: true },
        },
      },
    });
  }
}
