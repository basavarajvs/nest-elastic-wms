import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { LoadingDocksService } from '../loading-docks.service';
import { CreateLoadingDockDto, UpdateLoadingDockDto } from '../dtos/create-loading-dock.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/loading-docks')
@UseGuards(CaslGuard)
export class LoadingDocksWebController {
  constructor(private readonly service: LoadingDocksService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'LoadingDock' })
  @ApiOperation({ summary: 'Create a loading dock' })
  async create(@Body() dto: CreateLoadingDockDto, @Req() req: any) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'LoadingDock' })
  @ApiOperation({ summary: 'List loading docks' })
  async findAll(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.service.findAll(req.tenantContext.getTenantId(), facilityId);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'LoadingDock' })
  @ApiOperation({ summary: 'Get loading dock by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'LoadingDock' })
  @ApiOperation({ summary: 'Update a loading dock' })
  async update(@Param('id') id: string, @Body() dto: UpdateLoadingDockDto, @Req() req: any) {
    return this.service.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'LoadingDock' })
  @ApiOperation({ summary: 'Delete a loading dock' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.delete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
