import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { NonConformanceReportsService } from '../non-conformance-reports.service';
import { CreateNcrDto, UpdateNcrDto } from '../dtos/create-ncr.dto';

@ApiTags('WMS-WEB', 'Quality')
@Controller('web/non-conformance-reports')
@UseGuards(CaslGuard)
export class NonConformanceReportsWebController {
  constructor(private readonly service: NonConformanceReportsService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'NonConformanceReport' })
  @ApiOperation({ summary: 'Create a non-conformance report' })
  async create(@Body() dto: CreateNcrDto, @Req() req: any) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'NonConformanceReport' })
  @ApiOperation({ summary: 'List NCRs' })
  async findAll(@Req() req: any, @Query('status') status: string, @Query('facilityId') facilityId: string) {
    return this.service.findAll(req.tenantContext.getTenantId(), { status, facilityId });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'NonConformanceReport' })
  @ApiOperation({ summary: 'Get NCR by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'NonConformanceReport' })
  @ApiOperation({ summary: 'Update NCR (status, root cause, resolution)' })
  async update(@Param('id') id: string, @Body() dto: UpdateNcrDto, @Req() req: any) {
    return this.service.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'NonConformanceReport' })
  @ApiOperation({ summary: 'Delete an NCR' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.delete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
