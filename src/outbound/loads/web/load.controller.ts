import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { LoadService } from '../load.service';
import { CreateLoadDto, UpdateLoadDto } from '../dtos/create-load.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/loads')
@UseGuards(CaslGuard)
export class LoadWebController {
  constructor(private readonly loadService: LoadService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Load' })
  async create(@Req() req: any, @Body() dto: CreateLoadDto) {
    return this.loadService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Load' })
  async findAll(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: string,
  ) {
    return this.loadService.findAll(req.tenantContext.getTenantId(), facilityId, status);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Load' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.loadService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Load' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLoadDto) {
    return this.loadService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Get('load-number/:loadNumber')
  @CheckAbility({ action: 'read', subject: 'Load' })
  async findByLoadNumber(@Req() req: any, @Param('loadNumber') loadNumber: string) {
    return this.loadService.findByLoadNumber(loadNumber, req.tenantContext.getTenantId());
  }

  @Post(':id/mark-loaded')
  @CheckAbility({ action: 'update', subject: 'Load' })
  async markLoaded(@Req() req: any, @Param('id') id: string) {
    return this.loadService.markLoaded(id, req.tenantContext.getTenantId());
  }

  @Post(':id/mark-departed')
  @CheckAbility({ action: 'update', subject: 'Load' })
  async markDeparted(@Req() req: any, @Param('id') id: string) {
    return this.loadService.markDeparted(id, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Load' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.loadService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
