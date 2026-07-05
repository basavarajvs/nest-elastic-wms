import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { ShiftService } from '../shifts/shift.service';

@ApiTags('Labor Shifts')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/labor/shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Labor' })
  @ApiOperation({ summary: 'Create shift' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.shiftService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Labor' })
  @ApiOperation({ summary: 'List shifts' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shiftService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Labor' })
  @ApiOperation({ summary: 'Get shift by ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shiftService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Labor' })
  @ApiOperation({ summary: 'Update shift' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.shiftService.update(tenantId, userId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Labor' })
  @ApiOperation({ summary: 'Delete shift' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shiftService.delete(tenantId, BigInt(id));
  }
}
