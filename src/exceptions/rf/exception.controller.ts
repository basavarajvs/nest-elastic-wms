import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { ExceptionManagementService } from '../exception-management.service';

@ApiTags('WMS-RF - Exceptions')
@Controller('rf/exceptions')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class ExceptionRfController {
  constructor(private readonly exceptionManagementService: ExceptionManagementService) {}

  @Post('report')
  @RfAction('create')
  async report(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.exceptionManagementService.create(tenantId, {
      ...dto,
      createdBy: userId,
      reportedByUserId: userId,
    });
  }
}
