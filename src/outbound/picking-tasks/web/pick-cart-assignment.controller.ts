import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { PickCartAssignmentService } from '../pick-cart-assignment.service';
import { PickCartAssignmentDto, CreatePickCartAssignmentDto, UpdatePickCartAssignmentDto } from '../dtos/response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Pick Cart Assignments')
@Controller('web/pick-cart-assignments')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PickCartAssignmentController {
  constructor(private readonly service: PickCartAssignmentService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'PickCartAssignment' })
  @ApiOperation({ summary: 'Create pick cart assignment' })
  @ApiCreatedResponse({ type: PickCartAssignmentDto })
  async create(@Req() req: any, @Body() dto: CreatePickCartAssignmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'PickCartAssignment' })
  @ApiOperation({ summary: 'List pick cart assignments' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'PickCartAssignment' })
  @ApiOperation({ summary: 'Get pick cart assignment' })
  @ApiOkResponse({ type: PickCartAssignmentDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'PickCartAssignment' })
  @ApiOperation({ summary: 'Update pick cart assignment' })
  @ApiOkResponse({ type: PickCartAssignmentDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePickCartAssignmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'PickCartAssignment' })
  @ApiOperation({ summary: 'Delete pick cart assignment' })
  @ApiOkResponse({ type: PickCartAssignmentDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
