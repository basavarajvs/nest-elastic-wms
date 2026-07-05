import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ReturnsService } from '../returns.service';

@ApiTags('RF - Returns')
@Controller('rf/inbound/returns')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('lookup-rma')
  @ApiOperation({ summary: 'Lookup return by RMA number (RF)' })
  @RfAction('read')
  async lookupRma(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facilityId);
    return this.returnsService.findAll(tenantId, { search: dto.returnNumber || dto.rmaNumber, limit: 5, facilityId: facilityId.toString() });
  }

  @Post('receive')
  @ApiOperation({ summary: 'Receive returned item (RF) - scan SKU, enter qty' })
  @RfAction('create')
  async receive(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { received: true, message: 'Return item received', dto };
  }

  @Post('disposition')
  @ApiOperation({ summary: 'Set disposition on returned item (RF)' })
  @RfAction('update')
  async disposition(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { disposition: dto.disposition || 'RESTOCK', message: 'Disposition set', dto };
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete return receipt (RF)' })
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return { completed: true, message: 'Return completed' };
  }
}
