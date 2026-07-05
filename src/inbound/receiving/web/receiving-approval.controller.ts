import { Controller, Post, Get, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ReceivingApprovalService } from '../receiving-approval.service';

@Controller('web/receiving-approvals')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReceivingApprovalWebController {
  constructor(private readonly approvalService: ReceivingApprovalService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Get('pending')
  @CheckAbility({ action: 'read', subject: 'ReceivingApproval' })
  async getPending(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.approvalService.getPendingApprovals(this.getTenant(req), BigInt(facilityId));
  }

  @Post(':id/approve')
  @CheckAbility({ action: 'update', subject: 'ReceivingApproval' })
  async approve(@Req() req: any, @Param('id') id: string) {
    return this.approvalService.approve(this.getTenant(req), BigInt(id), req.user?.userId || 'system');
  }

  @Post(':id/reject')
  @CheckAbility({ action: 'update', subject: 'ReceivingApproval' })
  async reject(@Req() req: any, @Param('id') id: string) {
    return this.approvalService.reject(this.getTenant(req), BigInt(id), req.user?.userId || 'system');
  }
}
