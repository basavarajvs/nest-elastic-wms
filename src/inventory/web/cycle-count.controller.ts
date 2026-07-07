import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { CycleCountService } from '../counts/cycle-count.service';
import { CycleCountResponseDto, PaginatedCycleCountResponseDto, SubmitLineResponseDto, CreateCycleCountDto, UpdateCycleCountDto, SubmitCycleCountLineDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/cycle-counts')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CycleCountWebController {
  constructor(private readonly service: CycleCountService) {}

  @Post()
  @CheckAbility({ action: WmsAction.ExecuteCycleCount, subject: 'CycleCount' })
  @AuditLog({ eventType: 'CYCLE_COUNT_CREATE' })
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async create(@Req() req: any, @Body() dto: CreateCycleCountDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'CycleCount' })
  @ApiOkResponse({ type: PaginatedCycleCountResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'CycleCount' })
  @ApiOkResponse({ type: CycleCountResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'CycleCount' })
  @AuditLog({ eventType: 'CYCLE_COUNT_UPDATE' })
  @ApiOkResponse({ type: CycleCountResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCycleCountDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, id, dto);
  }

  @Post(':id/submit-line')
  @CheckAbility({ action: WmsAction.Count, subject: 'CycleCountLine' })
  @AuditLog({ eventType: 'CYCLE_COUNT_LINE' })
  @ApiCreatedResponse({ type: SubmitLineResponseDto })
  async submitLine(@Req() req: any, @Param('id') id: string, @Body() dto: SubmitCycleCountLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.submitLine(tenantId, id, dto);
  }

  @Post(':id/complete')
  @CheckAbility({ action: WmsAction.ExecuteCycleCount, subject: 'CycleCount' })
  @AuditLog({ eventType: 'CYCLE_COUNT_COMPLETE' })
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async complete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.complete(tenantId, id, userId);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'CycleCount' })
  @AuditLog({ eventType: 'CYCLE_COUNT_DELETE' })
  @ApiOkResponse({ type: CycleCountResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
