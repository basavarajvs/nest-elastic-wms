import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CountMetricsService } from '../count-metrics.service';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web')
@UseGuards(CaslGuard)
export class CountMetricsWebController {
  constructor(private readonly service: CountMetricsService) {}

  @Post('cycle-counts/:id/compute-metrics')
  @CheckAbility({ action: 'update', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Compute metrics for a cycle count' })
  async computeMetrics(@Param('id') id: string, @Req() req: any) {
    return this.service.computeMetrics(id, req.tenantContext.getTenantId());
  }

  @Get('cycle-counts/metrics')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Aggregate metrics across counts' })
  @ApiQuery({ name: 'facilityId', required: false })
  async getAggregateMetrics(@Req() req: any, @Query('facilityId') facilityId?: string) {
    return this.service.getAggregateMetrics(req.tenantContext.getTenantId(), facilityId);
  }

  @Get('cycle-counts/:id/metrics')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Metrics for a specific count' })
  async getMetrics(@Param('id') id: string, @Req() req: any) {
    return this.service.getMetrics(id, req.tenantContext.getTenantId());
  }

  @Get('count-accuracy')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiOperation({ summary: 'Accuracy records' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getAccuracyRecords(
    @Req() req: any,
    @Query('productId') productId?: string,
    @Query('facilityId') facilityId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getAccuracyRecords(req.tenantContext.getTenantId(), { productId, facilityId, fromDate, toDate });
  }
}
