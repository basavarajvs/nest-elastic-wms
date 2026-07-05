import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductImportService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(tenantId: string, dto: any) {
    const jobNumber = `IMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const job = await this.prisma.product_import_jobs.create({
      data: {
        tenant_id: tenantId,
        job_number: jobNumber,
        job_name: dto.jobName,
        uploaded_by: dto.uploadedBy ? BigInt(dto.uploadedBy) : 0n,
        file_name: dto.fileName,
        file_path: dto.filePath,
        file_size_bytes: dto.fileSizeBytes ? BigInt(dto.fileSizeBytes) : undefined,
        file_format: dto.fileFormat,
        job_status: 'UPLOADED',
        total_rows: dto.totalRows,
        configuration_json: dto.configurationJson,
        created_by: dto.createdBy ? BigInt(dto.createdBy) : undefined,
      },
    });

    if (dto.results?.length) {
      await this.prisma.product_import_results.createMany({
        data: dto.results.map((r: any) => ({
          tenant_id: tenantId,
          job_id: job.job_id,
          row_number: r.rowNumber,
          product_code: r.productCode,
          product_name: r.productName,
          import_status: r.importStatus || 'PENDING',
          error_message: r.errorMessage,
          raw_data_json: r.rawDataJson,
        })),
      });
    }

    return this.findJobById(tenantId, job.job_id);
  }

  async findJobs(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.jobStatus) where.job_status = query.jobStatus;
    if (query.search) {
      where.OR = [
        { job_number: { contains: query.search, mode: 'insensitive' } },
        { job_name: { contains: query.search, mode: 'insensitive' } },
        { file_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_import_jobs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploaded_at: 'desc' },
        include: {
          _count: { select: { product_import_results: true } },
        },
      }),
      this.prisma.product_import_jobs.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, jobId: bigint) {
    return this.prisma.product_import_jobs.deleteMany({
      where: { tenant_id: tenantId, job_id: jobId },
    });
  }

  async findJobById(tenantId: string, jobId: bigint) {
    return this.prisma.product_import_jobs.findFirst({
      where: { tenant_id: tenantId, job_id: jobId },
      include: {
        product_import_results: {
          orderBy: { row_number: 'asc' },
        },
      },
    });
  }
}
