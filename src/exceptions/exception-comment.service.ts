import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExceptionCommentService {
  private readonly logger = new Logger(ExceptionCommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addComment(tenantId: string, exceptionId: bigint, dto: any) {
    return this.prisma.exception_comments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        exception_id: exceptionId,
        comment_text: dto.commentText,
        comment_type: dto.commentType || 'GENERAL',
        commented_by_user_id: dto.commentedByUserId,
        is_internal: dto.isInternal ?? false,
        created_by: dto.createdBy,
      },
    });
  }

  async getComments(tenantId: string, exceptionId: bigint) {
    return this.prisma.exception_comments.findMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      orderBy: { commented_at: 'asc' },
    });
  }
}
