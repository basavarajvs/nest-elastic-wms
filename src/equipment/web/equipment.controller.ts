import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { EquipmentService } from '../equipment.service';
import { MaintenanceService } from '../maintenance.service';
import {
  CreateEquipmentDto, UpdateEquipmentDto, ChangeEquipmentStatusDto,
  CreateMaintenanceDto, CompleteMaintenanceDto, ListEquipmentDto, ListMaintenanceDto,
} from '../dtos/equipment.dto';

@ApiTags('WMS-WEB', 'Equipment')
@Controller('web/equipment')
@UseGuards(CaslGuard)
export class EquipmentWebController {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'WarehouseEquipment' })
  @ApiOperation({ summary: 'Register equipment' })
  async create(@Body() dto: CreateEquipmentDto, @Req() req: any) {
    return this.equipmentService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'WarehouseEquipment' })
  @ApiOperation({ summary: 'List equipment' })
  async list(@Req() req: any, @Query() filters: ListEquipmentDto) {
    return this.equipmentService.list(req.tenantContext.getTenantId(), filters);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'WarehouseEquipment' })
  @ApiOperation({ summary: 'Update equipment' })
  async update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto, @Req() req: any) {
    return this.equipmentService.update(id, dto, req.tenantContext.getTenantId());
  }

  @Patch(':id/status')
  @CheckAbility({ action: 'update', subject: 'WarehouseEquipment' })
  @ApiOperation({ summary: 'Change equipment status' })
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeEquipmentStatusDto, @Req() req: any) {
    return this.equipmentService.changeStatus(id, dto, req.tenantContext.getTenantId());
  }

  @Post(':id/maintenance')
  @CheckAbility({ action: 'create', subject: 'EquipmentMaintenance' })
  @ApiOperation({ summary: 'Create maintenance record' })
  async createMaintenance(@Param('id') id: string, @Body() dto: CreateMaintenanceDto, @Req() req: any) {
    dto.equipmentId = id;
    return this.maintenanceService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('maintenance')
  @CheckAbility({ action: 'read', subject: 'EquipmentMaintenance' })
  @ApiOperation({ summary: 'List maintenance records' })
  async listMaintenance(@Req() req: any, @Query() filters: ListMaintenanceDto) {
    return this.maintenanceService.list(req.tenantContext.getTenantId(), filters);
  }

  @Patch('maintenance/:id/complete')
  @CheckAbility({ action: 'update', subject: 'EquipmentMaintenance' })
  @ApiOperation({ summary: 'Complete maintenance record' })
  async completeMaintenance(@Param('id') id: string, @Body() dto: CompleteMaintenanceDto, @Req() req: any) {
    return this.maintenanceService.complete(id, dto, req.tenantContext.getTenantId());
  }
}
