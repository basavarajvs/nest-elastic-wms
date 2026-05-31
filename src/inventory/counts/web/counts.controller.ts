import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CycleCountService } from '../cycle-count.service';
import { ScheduleCountDto, SubmitCountLineDto, AdhocCountDto, BatchSubmitLinesDto, CountSummaryDto } from '../dtos/count.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/cycle-counts')
@UseGuards(CaslGuard)
export class CountWebController {
  constructor(private readonly countService: CycleCountService) {}

  @Post('/schedule')
  @CheckAbility({ action: 'create', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Schedule a cycle count' })
  async schedule(@Req() req: any, @Body() dto: ScheduleCountDto) {
    return this.countService.schedule(dto, req.tenantContext.getTenantId());
  }

  @Post('/adhoc')
  @CheckAbility({ action: 'create', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Create an ad-hoc count for specific locations' })
  async adhoc(@Req() req: any, @Body() dto: AdhocCountDto) {
    return this.countService.adhocCount(dto, req.tenantContext.getTenantId());
  }

  @Post('/batch-submit')
  @CheckAbility({ action: 'update', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Batch submit count lines' })
  async batchSubmit(@Req() req: any, @Body() dto: BatchSubmitLinesDto) {
    return this.countService.batchSubmitLines(dto, req.tenantContext.getTenantId());
  }

  @Get('/summary')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Get count summary analytics' })
  async summary(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.countService.getSummary(req.tenantContext.getTenantId(), facilityId);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'List cycle counts' })
  async list(@Req() req: any, @Query('status') status: string, @Query('facilityId') facilityId: string) {
    return this.countService.list(req.tenantContext.getTenantId(), { status, facilityId });
  }

  @Get(':id/lines')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Get count lines (hides system qty for blind counts)' })
  async getLines(@Param('id') id: string, @Req() req: any) {
    return this.countService.getCountLines(id, req.tenantContext.getTenantId());
  }

  @Post(':id/finalize')
  @CheckAbility({ action: 'update', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Finalize a cycle count' })
  async finalize(@Param('id') id: string, @Req() req: any) {
    return this.countService.finalizeCount(id, req.tenantContext.getTenantId());
  }
}
