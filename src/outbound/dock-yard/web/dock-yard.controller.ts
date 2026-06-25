import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { DockYardService } from '../dock-yard.service';
import { CreateAppointmentDto, RegisterVehicleDto, AssignDockDto, ListAppointmentsDto } from '../dtos/dock-yard.dto';

@ApiTags('WMS-WEB', 'Dock & Yard')
@Controller('web/dock-appointments')
@UseGuards(CaslGuard)
export class DockAppointmentWebController {
  constructor(private readonly service: DockYardService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'DockAppointment' })
  @ApiOperation({ summary: 'Create a dock appointment' })
  async create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.service.createAppointment(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'DockAppointment' })
  @ApiOperation({ summary: 'List dock appointments' })
  async list(@Req() req: any, @Query() filters: ListAppointmentsDto) {
    return this.service.listAppointments(req.tenantContext.getTenantId(), filters);
  }

  @Patch(':id/check-in')
  @CheckAbility({ action: 'update', subject: 'DockAppointment' })
  @ApiOperation({ summary: 'Check in to dock appointment' })
  async checkIn(@Param('id') id: string, @Req() req: any) {
    return this.service.checkIn(id, req.tenantContext.getTenantId());
  }

  @Patch(':id/complete')
  @CheckAbility({ action: 'update', subject: 'DockAppointment' })
  @ApiOperation({ summary: 'Complete dock appointment' })
  async complete(@Param('id') id: string, @Req() req: any) {
    return this.service.complete(id, req.tenantContext.getTenantId());
  }

  @Patch(':id/cancel')
  @CheckAbility({ action: 'update', subject: 'DockAppointment' })
  @ApiOperation({ summary: 'Cancel dock appointment' })
  async cancel(@Param('id') id: string, @Req() req: any) {
    return this.service.cancel(id, req.tenantContext.getTenantId());
  }
}

@ApiTags('WMS-WEB', 'Dock & Yard')
@Controller('web/yard/vehicles')
@UseGuards(CaslGuard)
export class YardVehicleWebController {
  constructor(private readonly service: DockYardService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'YardVehicle' })
  @ApiOperation({ summary: 'Register a yard vehicle' })
  async register(@Body() dto: RegisterVehicleDto, @Req() req: any) {
    return this.service.registerVehicle(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'YardVehicle' })
  @ApiOperation({ summary: 'List yard vehicles' })
  async list(@Req() req: any, @Query('facilityId') facilityId: string, @Query('status') status: string) {
    return this.service.listVehicles(req.tenantContext.getTenantId(), { facilityId, status });
  }

  @Patch(':id/assign-dock')
  @CheckAbility({ action: 'update', subject: 'YardVehicle' })
  @ApiOperation({ summary: 'Assign vehicle to dock' })
  async assignDock(@Param('id') id: string, @Body() dto: AssignDockDto, @Req() req: any) {
    return this.service.assignDock(id, dto.dockId, req.tenantContext.getTenantId());
  }

  @Patch(':id/depart')
  @CheckAbility({ action: 'update', subject: 'YardVehicle' })
  @ApiOperation({ summary: 'Mark vehicle as departed' })
  async depart(@Param('id') id: string, @Req() req: any) {
    return this.service.departVehicle(id, req.tenantContext.getTenantId());
  }
}
