import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PickingTaskService } from '../../picking-tasks/picking-task.service';
import { BackorderDto } from '../../picking-tasks/dtos/response.dto';

@ApiTags('Outbound - Backorders')
@Controller('web/backorders')
export class BackorderWebController {
  constructor(private readonly pickingTaskService: PickingTaskService) {}

  @Get()
  @ApiOperation({ summary: 'List all open backorders' })
  @ApiOkResponse({ type: [BackorderDto] })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.pickingTaskService.listBackorders(tenantId, query.facilityId ? BigInt(query.facilityId) : undefined);
  }
}
