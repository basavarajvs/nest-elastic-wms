import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditService } from '../audit.service';
import { WarehouseEventService } from '../warehouse-event.service';
import { QueryAuditLogsDto } from '../dtos/query-audit-logs.dto';
import { QueryEventsDto } from '../dtos/query-events.dto';

@ApiTags('WMS-WEB', 'Audit')
@Controller('web')
@UseGuards(CaslGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly eventService: WarehouseEventService,
  ) {}

  @Get('audit-logs')
  @CheckAbility({ action: 'read', subject: 'SystemAuditLog' })
  @ApiOperation({ summary: 'Query audit logs' })
  async queryAuditLogs(@Req() req: any, @Query() query: QueryAuditLogsDto) {
    return this.auditService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get('events')
  @CheckAbility({ action: 'read', subject: 'WarehouseEvent' })
  @ApiOperation({ summary: 'Query warehouse events' })
  async queryEvents(@Req() req: any, @Query() query: QueryEventsDto) {
    return this.eventService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get('events/:id')
  @CheckAbility({ action: 'read', subject: 'WarehouseEvent' })
  @ApiOperation({ summary: 'Get event detail' })
  async getEvent(@Param('id') id: string, @Req() req: any) {
    const event = await this.eventService.findById(id, req.tenantContext.getTenantId());
    if (!event) {
      return null;
    }
    return event;
  }
}
