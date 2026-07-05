import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { MaintenanceService } from '../maintenance/maintenance.service';

@ApiTags('Equipment Maintenance')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/equipment/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Equipment' })
  @ApiOperation({ summary: 'Create maintenance record' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.maintenanceService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Equipment' })
  @ApiOperation({ summary: 'List maintenance records' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.maintenanceService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Equipment' })
  @ApiOperation({ summary: 'Get maintenance record by ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.maintenanceService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Equipment' })
  @ApiOperation({ summary: 'Update maintenance record' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.maintenanceService.findById(tenantId, BigInt(id));
  }

  @Post(':id/complete')
  @CheckAbility({ action: 'update', subject: 'Equipment' })
  @ApiOperation({ summary: 'Complete maintenance' })
  async complete(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.maintenanceService.complete(tenantId, userId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Equipment' })
  @ApiOperation({ summary: 'Delete maintenance record' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.maintenanceService.delete(tenantId, BigInt(id));
  }
}
