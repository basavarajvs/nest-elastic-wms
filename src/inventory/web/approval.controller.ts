import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { AdjustmentApprovalService } from '../approvals/adjustment-approval.service';
import { ApprovalThresholdService } from '../approvals/approval-threshold.service';
import { AdjustmentApprovalResponseDto, PaginatedAdjustmentApprovalResponseDto, ApprovalThresholdConfigResponseDto, RejectApprovalDto, UpsertThresholdDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/approvals')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ApprovalWebController {
  constructor(
    private readonly approvalService: AdjustmentApprovalService,
    private readonly thresholdService: ApprovalThresholdService,
  ) {}

  @Get('pending')
  @CheckAbility({ action: WmsAction.List, subject: 'AdjustmentApproval' })
  @ApiOkResponse({ type: PaginatedAdjustmentApprovalResponseDto })
  async findPending(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.approvalService.findPending(tenantId, query);
  }

  @Post(':id/approve')
  @CheckAbility({ action: WmsAction.Approve, subject: 'AdjustmentApproval' })
  @AuditLog({ eventType: 'APPROVAL_APPROVE' })
  @ApiCreatedResponse({ type: AdjustmentApprovalResponseDto })
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.approvalService.approve(tenantId, id, userId);
  }

  @Post(':id/reject')
  @CheckAbility({ action: WmsAction.Approve, subject: 'AdjustmentApproval' })
  @AuditLog({ eventType: 'APPROVAL_REJECT' })
  @ApiCreatedResponse({ type: AdjustmentApprovalResponseDto })
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: RejectApprovalDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.approvalService.reject(tenantId, id, userId, dto?.reason);
  }

  @Get('thresholds')
  @CheckAbility({ action: WmsAction.Read, subject: 'ApprovalThresholdConfig' })
  @ApiOkResponse({ type: ApprovalThresholdConfigResponseDto })
  async getThreshold(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.thresholdService.findActive(tenantId);
  }

  @Post('thresholds')
  @CheckAbility({ action: WmsAction.Create, subject: 'ApprovalThresholdConfig' })
  @AuditLog({ eventType: 'THRESHOLD_UPSERT' })
  @ApiCreatedResponse({ type: ApprovalThresholdConfigResponseDto })
  async upsertThreshold(@Req() req: any, @Body() dto: UpsertThresholdDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.thresholdService.upsert(tenantId, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'AdjustmentApproval' })
  @AuditLog({ eventType: 'APPROVAL_DELETE' })
  @ApiOkResponse({ type: AdjustmentApprovalResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.approvalService.delete(tenantId, BigInt(id));
  }
}
