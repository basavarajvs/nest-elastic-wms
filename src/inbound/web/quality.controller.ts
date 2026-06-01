import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { QualityService } from '../quality.service';
import { QcService } from '../qc.service';
import { ListInspectionsDto } from '../dtos/quality.dto';
import { QcInspectDto } from '../dtos/qc.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Quality')
@Controller('web/quality')
@UseGuards(CaslGuard)
export class QualityWebController {
  constructor(
    private readonly qualityService: QualityService,
    private readonly qcService: QcService,
  ) {}

  @Get('/inspections')
  @CheckAbility({ action: 'read', subject: 'Inspection' })
  @ApiOperation({ summary: 'List quality inspections' })
  async listInspections(@Req() req: any, @Query() filter: ListInspectionsDto) {
    return this.qualityService.listInspections(req.tenantContext.getTenantId(), filter);
  }

  @Get('/inspections/:id')
  @CheckAbility({ action: 'read', subject: 'Inspection' })
  @ApiOperation({ summary: 'Get inspection detail' })
  async getInspection(@Req() req: any, @Param('id') id: string) {
    return this.qualityService.getInspection(id, req.tenantContext.getTenantId());
  }

  @Post('/inspections')
  @CheckAbility({ action: 'create', subject: 'Inspection' })
  @ApiOperation({ summary: 'Create an inspection (inspect a GRN line)' })
  async createInspection(@Req() req: any, @Body() dto: QcInspectDto) {
    return this.qcService.inspect(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }
}
