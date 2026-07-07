import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExceptionCommentService {
  private readonly logger = new Logger(ExceptionCommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addComment(tenantId: string, exceptionId: bigint, dto: any) {
    const record = await this.prisma.exception_comments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        exception_id: exceptionId,
        comment_text: dto.comment_text,
        comment_type: dto.comment_type || 'GENERAL',
        commented_by_user_id: dto.commented_by_user_id || dto.created_by,
        is_internal: dto.is_internal ?? false,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return this.flattenComment(record);
  }

  async getComments(tenantId: string, exceptionId: bigint) {
    const records = await this.prisma.exception_comments.findMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
      orderBy: { commented_at: 'asc' },
    });
    return records.map(r => this.flattenComment(r));
  }

  private flattenComment(record: any) {
    const { warehouse_facilities, ...rest } = record;
    return { ...rest, facility_name: warehouse_facilities?.facility_name || null };
  }
}
