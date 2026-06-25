import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfSessionGuard } from '../../common/guards/rf-session.guard';
import { EquipmentService } from '../equipment.service';

@ApiTags('WMS-RF', 'Equipment')
@Controller('rf/equipment')
@UseGuards(RfSessionGuard)
export class EquipmentRfController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('available')
  @ApiOperation({ summary: 'List available equipment' })
  async listAvailable(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.equipmentService.listAvailable(req.tenantContext.getTenantId(), facilityId);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Check out equipment (set IN_USE)' })
  async checkOut(@Param('id') id: string, @Req() req: any) {
    return this.equipmentService.checkOut(id, req.tenantContext.getTenantId());
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in equipment (set AVAILABLE)' })
  async checkIn(@Param('id') id: string, @Req() req: any) {
    return this.equipmentService.checkIn(id, req.tenantContext.getTenantId());
  }
}
