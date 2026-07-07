import { Controller, Get, Param, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuditLogResponseDto } from '../../dtos/observability.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { AuditLogService } from '../audit-log.service';

@ApiTags('Observability')
@Controller('web/audit-logs')
@UseGuards(JwtAuthGuard, CaslGuard)
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'SystemAuditLog' })
  @ApiOperation({ summary: 'List audit logs (filterable by action, tableName, userId, dateRange)' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.auditLogService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'SystemAuditLog' })
  @ApiOperation({ summary: 'Get audit log detail by ID' })
  @ApiOkResponse({ type: AuditLogResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.auditLogService.findById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'SystemAuditLog' })
  @ApiOperation({ summary: 'Delete audit log' })
  @ApiOkResponse({ type: AuditLogResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.auditLogService.delete(tenantId, BigInt(id));
  }
}
