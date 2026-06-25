import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ExceptionManagementService } from '../exception-management.service';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfAction } from '../../../common/guards/rf-action.decorator';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';

@ApiTags('WMS-RF')
@Controller('rf/exceptions')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class ExceptionManagementRfController {
  constructor(private readonly service: ExceptionManagementService) {}

  @Post('/report')
  @RfAction('create')
  async reportException(
    @Req() req: any,
    @Body('exceptionType') exceptionType: string,
    @Body('locationId') locationId: string,
    @Body('productId') productId: string,
    @Body('notes') notes: string,
  ) {
    return this.service.create({
      facilityId: req.facilityId ?? '',
      exceptionType,
      locationId: locationId || undefined,
      productId: productId || undefined,
      notes: notes || undefined,
    }, req.tenantContext.getTenantId(), req.user?.id);
  }

  @Get('/my-reports')
  @RfAction('read')
  async getMyReports(@Req() req: any) {
    return this.service.findAll(req.tenantContext.getTenantId());
  }

  @Get('/:id')
  @RfAction('read')
  async getException(@Param('id') id: string, @Req() req: any) {
    try {
      return this.service.findById(id, req.tenantContext.getTenantId());
    } catch {
      return { error: 'Exception not found' };
    }
  }
}
