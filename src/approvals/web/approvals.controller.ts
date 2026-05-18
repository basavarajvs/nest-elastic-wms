import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AdjustmentApprovalService } from '../adjustment-approval.service';
import { ApproveApprovalDto, RejectApprovalDto } from '../dtos/approval.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('/api/v1/wms/web/approvals')
@UseGuards(CaslGuard)
export class ApprovalWebController {
  constructor(private readonly approvalService: AdjustmentApprovalService) {}

  @Get('/pending')
  @CheckAbility({ action: 'read', subject: 'AdjustmentApproval' })
  async getPending(@Req() req: any, @Body('facilityId') facilityId: string) {
    return this.approvalService.getPending(req.tenantContext.getTenantId(), facilityId);
  }

  @Post(':id/approve')
  @CheckAbility({ action: 'approve', subject: 'AdjustmentApproval' })
  async approve(@Req() req: any, @Param('id') id: string, @Body() dto: ApproveApprovalDto) {
    return this.approvalService.approve(id, dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post(':id/reject')
  @CheckAbility({ action: 'update', subject: 'AdjustmentApproval' })
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: RejectApprovalDto) {
    return this.approvalService.reject(id, dto, req.tenantContext.getTenantId());
  }
}
