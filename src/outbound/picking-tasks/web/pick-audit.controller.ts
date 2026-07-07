import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditTimelineDto } from '../dtos/response.dto';

@ApiTags('Outbound - Pick Audit')
@Controller('web/audit/pick')
export class PickAuditWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':taskId/timeline')
  @ApiOperation({ summary: 'Get pick audit timeline for a task' })
  @ApiOkResponse({ type: [AuditTimelineDto] })
  async timeline(@Req() req: any, @Param('taskId') taskId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.pick_audit_log.findMany({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
      orderBy: { recorded_at: 'asc' },
    });
  }
}
