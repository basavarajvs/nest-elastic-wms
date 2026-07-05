import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { DockYardService } from '../dock-yard.service';

@ApiTags('Dock & Yard')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DockYardWebController {
  constructor(private readonly service: DockYardService) {}

  // ─── APPOINTMENTS ────────────────────────────────────────────────────────

  @Post('dock-appointments')
  @CheckAbility({ action: WmsAction.Create, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CREATE' })
  async createAppointment(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createAppointment(tenantId, dto);
  }

  @Get('dock-appointments')
  @CheckAbility({ action: WmsAction.List, subject: 'DockAppointment' })
  async findAllAppointments(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllAppointments(tenantId, query);
  }

  @Get('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'DockAppointment' })
  async findAppointmentById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAppointmentById(tenantId, BigInt(id));
  }

  @Patch('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_UPDATE' })
  async updateAppointment(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateAppointment(tenantId, BigInt(id), dto);
  }

  @Patch('dock-appointments/:id/check-in')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CHECKIN' })
  async checkIn(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.checkInAppointment(tenantId, BigInt(id), dto?.dockId ? BigInt(dto.dockId) : undefined);
  }

  @Patch('dock-appointments/:id/complete')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_COMPLETE' })
  async completeAppointment(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeAppointment(tenantId, BigInt(id));
  }

  @Patch('dock-appointments/:id/cancel')
  @CheckAbility({ action: WmsAction.Cancel, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CANCEL' })
  async cancelAppointment(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.cancelAppointment(tenantId, BigInt(id), dto?.reason);
  }

  // ─── YARD VEHICLES ──────────────────────────────────────────────────────

  @Post('yard/vehicles')
  @CheckAbility({ action: WmsAction.Create, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_CREATE' })
  async createVehicle(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createVehicle(tenantId, dto);
  }

  @Get('yard/vehicles')
  @CheckAbility({ action: WmsAction.List, subject: 'YardVehicle' })
  async findAllVehicles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllVehicles(tenantId, query);
  }

  @Get('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'YardVehicle' })
  async findVehicleById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findVehicleById(tenantId, BigInt(id));
  }

  @Patch('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_UPDATE' })
  async updateVehicle(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateVehicle(tenantId, BigInt(id), dto);
  }

  @Patch('yard/vehicles/:id/assign-dock')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_ASSIGN_DOCK' })
  async assignVehicleToDock(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignVehicleToDock(tenantId, BigInt(id), BigInt(dto.appointmentId));
  }

  @Patch('yard/vehicles/:id/depart')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_DEPART' })
  async departVehicle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.departVehicle(tenantId, BigInt(id));
  }

  @Delete('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_DELETE' })
  @ApiOperation({ summary: 'Delete dock appointment' })
  async deleteAppointment(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteAppointment(tenantId, BigInt(id));
  }

  @Delete('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_DELETE' })
  @ApiOperation({ summary: 'Delete yard vehicle' })
  async deleteVehicle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteVehicle(tenantId, BigInt(id));
  }
}
