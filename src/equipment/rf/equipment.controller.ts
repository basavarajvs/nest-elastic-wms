import { Controller, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../common/decorators/rf-action.decorator';
import { EquipmentService } from '../equipment.service';

@ApiTags('WMS-RF Equipment')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
@Controller('rf/equipment')
export class RfEquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post('available')
  @RfAction('read')
  @ApiOperation({ summary: 'RF: List available equipment' })
  async available(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.equipmentService.findAll(tenantId, { ...dto, status: 'AVAILABLE' });
  }

  @Post(':id/check-out')
  @RfAction('create')
  @ApiOperation({ summary: 'RF: Check out equipment (set IN_USE)' })
  async checkOut(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.equipmentService.updateStatus(tenantId, userId, BigInt(id), 'IN_USE');
  }

  @Post(':id/check-in')
  @RfAction('update')
  @ApiOperation({ summary: 'RF: Check in equipment (set AVAILABLE)' })
  async checkIn(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.rfSession?.userId;
    return this.equipmentService.updateStatus(tenantId, userId, BigInt(id), 'AVAILABLE');
  }
}
