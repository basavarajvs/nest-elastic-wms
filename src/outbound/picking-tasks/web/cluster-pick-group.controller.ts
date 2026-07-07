import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { ClusterPickGroupService } from '../cluster-pick-group.service';
import { ClusterPickGroupDto, CreateClusterPickGroupDto, UpdateClusterPickGroupDto } from '../dtos/response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Cluster Pick Groups')
@Controller('web/cluster-pick-groups')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ClusterPickGroupController {
  constructor(private readonly service: ClusterPickGroupService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ClusterPickGroup' })
  @ApiOperation({ summary: 'Create cluster pick group' })
  @ApiCreatedResponse({ type: ClusterPickGroupDto })
  async create(@Req() req: any, @Body() dto: CreateClusterPickGroupDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ClusterPickGroup' })
  @ApiOperation({ summary: 'List cluster pick groups' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ClusterPickGroup' })
  @ApiOperation({ summary: 'Get cluster pick group' })
  @ApiOkResponse({ type: ClusterPickGroupDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ClusterPickGroup' })
  @ApiOperation({ summary: 'Update cluster pick group' })
  @ApiOkResponse({ type: ClusterPickGroupDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClusterPickGroupDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ClusterPickGroup' })
  @ApiOperation({ summary: 'Delete cluster pick group' })
  @ApiOkResponse({ type: ClusterPickGroupDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
