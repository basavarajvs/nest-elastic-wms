import { Controller, Post, Get, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { InspectionService } from '../inspections/inspection.service';
import { QualityInspectionDto, SupervisorApproveResultDto, SupervisorRejectResultDto, SupervisorApproveDto } from '../dtos/inspection.dto';

@ApiTags('Quality')
@Controller('web/quality/inspections')
@UseGuards(JwtAuthGuard, CaslGuard)
export class InspectionWebController {
  constructor(private readonly service: InspectionService) {}

  private getTenant(req: any): string { return req.tenantContext.getTenantId(); }

  @Get('pending-review')
  @ApiOkResponse({ type: [QualityInspectionDto] })
  @CheckAbility({ action: 'read', subject: 'QualityInspection' })
  async pendingReview(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.service.getPendingReviews(this.getTenant(req), BigInt(facilityId));
  }

  @Post(':id/supervisor-approve')
  @ApiCreatedResponse({ type: SupervisorApproveResultDto })
  @CheckAbility({ action: 'update', subject: 'QualityInspection' })
  async supervisorApprove(@Req() req: any, @Param('id') id: string, @Body() dto: SupervisorApproveDto) {
    return this.service.supervisorApprove(this.getTenant(req), BigInt(id), req.user?.userId || 'system', dto.override_disposition);
  }

  @Post(':id/supervisor-reject')
  @ApiCreatedResponse({ type: SupervisorRejectResultDto })
  @CheckAbility({ action: 'update', subject: 'QualityInspection' })
  async supervisorReject(@Req() req: any, @Param('id') id: string) {
    return this.service.supervisorReject(this.getTenant(req), BigInt(id), req.user?.userId || 'system');
  }
}
