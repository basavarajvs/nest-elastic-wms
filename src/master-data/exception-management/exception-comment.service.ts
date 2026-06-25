import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dtos/comment.dto';

@Injectable()
export class ExceptionCommentService {
  private readonly logger = new Logger(ExceptionCommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addComment(
    exceptionId: string,
    dto: CreateCommentDto,
    tenantId: string,
    authorUserId: string,
  ): Promise<any> {
    const exception = await (this.prisma as any).exceptionManagement.findFirst({
      where: { id: exceptionId, tenantId },
    });
    if (!exception) throw new NotFoundException('Exception not found');

    return (this.prisma as any).exceptionComment.create({
      data: {
        tenantId,
        exceptionId,
        body: dto.body,
        authorUserId,
        isInternal: dto.isInternal ?? false,
      },
    });
  }

  async listComments(exceptionId: string, tenantId: string): Promise<any[]> {
    const exception = await (this.prisma as any).exceptionManagement.findFirst({
      where: { id: exceptionId, tenantId },
    });
    if (!exception) throw new NotFoundException('Exception not found');

    return (this.prisma as any).exceptionComment.findMany({
      where: { tenantId, exceptionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
