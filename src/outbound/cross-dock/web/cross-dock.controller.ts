import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { CrossDockService } from '../cross-dock.service';
import { CrossDockOperationDto, CrossDockOperationPaginatedResponseDto, CreateCrossDockDto, UpdateCrossDockDto } from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Cross Dock')
@Controller('web/cross-dock-operations')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CrossDockWebController {
  constructor(private readonly service: CrossDockService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CrossDockOperation' })
  @AuditLog({ eventType: 'CROSS_DOCK_CREATED', detail: (req, body) => `Created cross-dock ${body.crossDockNumber}` })
  @ApiCreatedResponse({ type: CrossDockOperationDto })
  async create(@Req() req: any, @Body() dto: CreateCrossDockDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CrossDockOperation' })
  @ApiOkResponse({ type: CrossDockOperationPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CrossDockOperation' })
  @ApiOkResponse({ type: CrossDockOperationDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CrossDockOperation' })
  @AuditLog({ eventType: 'CROSS_DOCK_UPDATED', detail: (req) => `Updated cross-dock ${req.params.id}` })
  @ApiOkResponse({ type: CrossDockOperationDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCrossDockDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.update(tenantId, BigInt(id), userId, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CrossDockOperation' })
  @AuditLog({ eventType: 'CROSS_DOCK_DELETED', detail: (req) => `Deleted cross-dock ${req.params.id}` })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}

