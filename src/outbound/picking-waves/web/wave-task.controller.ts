import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PickingTaskService } from '../../picking-tasks/picking-task.service';
import { WaveTaskDto } from '../dtos/response.dto';

@ApiTags('Outbound - Wave Tasks')
@Controller('web/wave-tasks')
export class WaveTaskWebController {
  constructor(private readonly pickingTaskService: PickingTaskService) {}

  @Get(':waveId')
  @ApiOperation({ summary: 'Get all tasks in a wave with full details' })
  @ApiOkResponse({ type: [WaveTaskDto] })
  async findByWaveId(@Req() req: any, @Param('waveId') waveId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.getWaveTasks(tenantId, BigInt(waveId));
  }
}
