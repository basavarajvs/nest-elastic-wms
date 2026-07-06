import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PickingTaskService } from '../../picking-tasks/picking-task.service';

@ApiTags('Outbound - Wave Tasks')
@Controller('web/wave-tasks')
export class WaveTaskWebController {
  constructor(private readonly pickingTaskService: PickingTaskService) {}

  @Get(':waveId')
  @ApiOperation({ summary: 'Get all tasks in a wave with full details' })
  async findByWaveId(@Req() req: any, @Param('waveId') waveId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.getWaveTasks(tenantId, BigInt(waveId));
  }
}
