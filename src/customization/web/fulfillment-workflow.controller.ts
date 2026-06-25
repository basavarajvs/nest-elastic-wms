import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { FulfillmentWorkflowService } from '../fulfillment/fulfillment-workflow.service';

@ApiTags('WMS-WEB', 'Workflows')
@Controller('web/workflows/instances')
@UseGuards(CaslGuard)
export class FulfillmentWorkflowController {
  constructor(
    private readonly workflowService: FulfillmentWorkflowService,
  ) {}

  @Get(':id/events')
  @CheckAbility({ action: 'read', subject: 'FulfillmentWorkflowEvent' })
  @ApiOperation({ summary: 'Workflow event timeline' })
  async getEvents(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.getEvents(id, req.tenantContext.getTenantId());
  }

  @Get(':id/transitions')
  @CheckAbility({ action: 'read', subject: 'FulfillmentWorkflowTransition' })
  @ApiOperation({ summary: 'Transition history' })
  async getTransitions(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.getTransitions(id, req.tenantContext.getTenantId());
  }
}
