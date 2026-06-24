import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { QualityInspectionsService } from '../quality-inspections.service';
import { CreateInspectionDto, UpdateInspectionDto, CreateInspectionResultDto } from '../dtos/inspection.dto';

@ApiTags('WMS-WEB', 'Quality')
@Controller('web/quality/inspections')
@UseGuards(CaslGuard)
export class QualityInspectionsWebController {
  constructor(private readonly service: QualityInspectionsService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'Create a quality inspection' })
  async create(@Body() dto: CreateInspectionDto, @Req() req: any) {
    return this.service.create(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'List quality inspections (filter by status, type)' })
  async findAll(
    @Req() req: any,
    @Query('status') status: string,
    @Query('inspectionType') inspectionType: string,
    @Query('facilityId') facilityId: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), { status, inspectionType, facilityId });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'Get inspection with results and events' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'Update inspection (status, assignee)' })
  async update(@Param('id') id: string, @Body() dto: UpdateInspectionDto, @Req() req: any) {
    return this.service.update(id, dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post(':id/results')
  @CheckAbility({ action: 'update', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'Submit an inspection result' })
  async submitResult(@Param('id') id: string, @Body() dto: CreateInspectionResultDto, @Req() req: any) {
    return this.service.submitResult(id, dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get(':id/events')
  @CheckAbility({ action: 'read', subject: 'QualityInspection' })
  @ApiOperation({ summary: 'Get inspection event timeline' })
  async getEvents(@Param('id') id: string, @Req() req: any) {
    return this.service.getEvents(id, req.tenantContext.getTenantId());
  }
}
