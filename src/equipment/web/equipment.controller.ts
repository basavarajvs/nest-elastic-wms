import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { EquipmentService } from '../equipment.service';

@ApiTags('Equipment')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Equipment' })
  @ApiOperation({ summary: 'Create equipment' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.equipmentService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Equipment' })
  @ApiOperation({ summary: 'List equipment' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.equipmentService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Equipment' })
  @ApiOperation({ summary: 'Get equipment by ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.equipmentService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Equipment' })
  @ApiOperation({ summary: 'Update equipment' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.equipmentService.update(tenantId, userId, BigInt(id), dto);
  }

  @Patch(':id/status')
  @CheckAbility({ action: 'update', subject: 'Equipment' })
  @ApiOperation({ summary: 'Update equipment status' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.equipmentService.updateStatus(tenantId, userId, BigInt(id), dto.status);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Equipment' })
  @ApiOperation({ summary: 'Delete equipment' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.equipmentService.delete(tenantId, BigInt(id));
  }
}
