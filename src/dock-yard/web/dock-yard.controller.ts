import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { DockYardService } from '../dock-yard.service';
import { DeleteResultDto } from '../../common/dto/paginated-response.dto';
import { DockAppointmentDto, DockAppointmentsResponseDto, YardVehicleDto, YardVehiclesResponseDto, CreateDockAppointmentDto, UpdateDockAppointmentDto, CreateYardVehicleDto, UpdateYardVehicleDto } from '../dtos/dock-yard-response.dto';

@ApiTags('Dock & Yard')
@Controller('web')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DockYardWebController {
  constructor(private readonly service: DockYardService) {}

  // ─── APPOINTMENTS ────────────────────────────────────────────────────────

  @Post('dock-appointments')
  @CheckAbility({ action: WmsAction.Create, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CREATE' })
  @ApiOperation({ summary: 'Create dock appointment' })
  @ApiCreatedResponse({ type: DockAppointmentDto })
  async createAppointment(@Req() req: any, @Body() dto: CreateDockAppointmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createAppointment(tenantId, dto);
  }

  @Get('dock-appointments')
  @CheckAbility({ action: WmsAction.List, subject: 'DockAppointment' })
  @ApiOperation({ summary: 'List dock appointments' })
  @ApiOkResponse({ type: DockAppointmentsResponseDto })
  async findAllAppointments(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllAppointments(tenantId, query);
  }

  @Get('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'DockAppointment' })
  @ApiOperation({ summary: 'Get dock appointment by ID' })
  @ApiOkResponse({ type: DockAppointmentDto })
  async findAppointmentById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAppointmentById(tenantId, BigInt(id));
  }

  @Patch('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_UPDATE' })
  @ApiOperation({ summary: 'Update dock appointment' })
  @ApiOkResponse({ type: DockAppointmentDto })
  async updateAppointment(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDockAppointmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateAppointment(tenantId, BigInt(id), dto);
  }

  @Patch('dock-appointments/:id/check-in')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CHECKIN' })
  @ApiOperation({ summary: 'Check-in dock appointment' })
  @ApiOkResponse({ type: DockAppointmentDto })
  async checkIn(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDockAppointmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.checkInAppointment(tenantId, BigInt(id), dto.assigned_dock_id ? BigInt(dto.assigned_dock_id) : undefined);
  }

  @Patch('dock-appointments/:id/complete')
  @CheckAbility({ action: WmsAction.Update, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_COMPLETE' })
  @ApiOperation({ summary: 'Complete dock appointment' })
  @ApiOkResponse({ type: DockAppointmentDto })
  async completeAppointment(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.completeAppointment(tenantId, BigInt(id));
  }

  @Patch('dock-appointments/:id/cancel')
  @CheckAbility({ action: WmsAction.Cancel, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_CANCEL' })
  @ApiOperation({ summary: 'Cancel dock appointment' })
  @ApiOkResponse({ type: DockAppointmentDto })
  async cancelAppointment(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDockAppointmentDto & { reason?: string }) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.cancelAppointment(tenantId, BigInt(id), dto?.reason);
  }

  // ─── YARD VEHICLES ──────────────────────────────────────────────────────

  @Post('yard/vehicles')
  @CheckAbility({ action: WmsAction.Create, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_CREATE' })
  @ApiOperation({ summary: 'Create yard vehicle' })
  @ApiCreatedResponse({ type: YardVehicleDto })
  async createVehicle(@Req() req: any, @Body() dto: CreateYardVehicleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.createVehicle(tenantId, dto);
  }

  @Get('yard/vehicles')
  @CheckAbility({ action: WmsAction.List, subject: 'YardVehicle' })
  @ApiOperation({ summary: 'List yard vehicles' })
  @ApiOkResponse({ type: YardVehiclesResponseDto })
  async findAllVehicles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAllVehicles(tenantId, query);
  }

  @Get('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'YardVehicle' })
  @ApiOperation({ summary: 'Get yard vehicle by ID' })
  @ApiOkResponse({ type: YardVehicleDto })
  async findVehicleById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findVehicleById(tenantId, BigInt(id));
  }

  @Patch('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_UPDATE' })
  @ApiOperation({ summary: 'Update yard vehicle' })
  @ApiOkResponse({ type: YardVehicleDto })
  async updateVehicle(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateYardVehicleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.updateVehicle(tenantId, BigInt(id), dto);
  }

  @Patch('yard/vehicles/:id/assign-dock')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_ASSIGN_DOCK' })
  @ApiOperation({ summary: 'Assign vehicle to dock' })
  @ApiOkResponse({ type: YardVehicleDto })
  async assignVehicleToDock(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateYardVehicleDto & { appointmentId: string }) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.assignVehicleToDock(tenantId, BigInt(id), BigInt(dto.appointmentId));
  }

  @Patch('yard/vehicles/:id/depart')
  @CheckAbility({ action: WmsAction.Update, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_DEPART' })
  @ApiOperation({ summary: 'Depart yard vehicle' })
  @ApiOkResponse({ type: YardVehicleDto })
  async departVehicle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.departVehicle(tenantId, BigInt(id));
  }

  @Delete('dock-appointments/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'DockAppointment' })
  @AuditLog({ eventType: 'DOCK_APPOINTMENT_DELETE' })
  @ApiOperation({ summary: 'Delete dock appointment' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteAppointment(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteAppointment(tenantId, BigInt(id));
  }

  @Delete('yard/vehicles/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'YardVehicle' })
  @AuditLog({ eventType: 'YARD_VEHICLE_DELETE' })
  @ApiOperation({ summary: 'Delete yard vehicle' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteVehicle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.deleteVehicle(tenantId, BigInt(id));
  }
}
