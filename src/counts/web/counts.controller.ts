import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CycleCountService } from '../cycle-count.service';
import { ScheduleCountDto, SubmitCountLineDto } from '../dtos/count.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('/api/v1/wms/web/cycle-counts')
@UseGuards(CaslGuard)
export class CountWebController {
  constructor(private readonly countService: CycleCountService) {}

  @Post('/schedule')
  @CheckAbility({ action: 'create', subject: 'CycleCount' })
  async schedule(@Req() req: any, @Body() dto: ScheduleCountDto) {
    return this.countService.schedule(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  async list(@Req() req: any, @Query('status') status: string, @Query('facilityId') facilityId: string) {
    return this.countService.list(req.tenantContext.getTenantId(), { status, facilityId });
  }
}
