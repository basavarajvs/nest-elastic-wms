import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { VasExecutionService } from '../vas-execution.service';
import { CreateVasTaskDto, UpdateVasTaskDto } from '../dtos/create-vas-task.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/vas-tasks')
@UseGuards(CaslGuard)
export class VasExecutionWebController {
  constructor(private readonly service: VasExecutionService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Create a VAS task' })
  async create(@Body() dto: CreateVasTaskDto, @Req() req: any) {
    return this.service.createTask(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'List VAS tasks' })
  async findAll(@Req() req: any, @Query('status') status: string, @Query('facilityId') facilityId: string) {
    return this.service.findAll(req.tenantContext.getTenantId(), { status, facilityId });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Get VAS task by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Update VAS task (status, progress)' })
  async update(@Param('id') id: string, @Body() dto: UpdateVasTaskDto, @Req() req: any) {
    return this.service.updateTask(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Delete a VAS task' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.deleteTask(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }

  @Post(':id/events')
  @CheckAbility({ action: 'update', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Record a VAS task event' })
  async addEvent(@Param('id') id: string, @Body('eventType') eventType: string, @Body('payload') payload: string, @Req() req: any) {
    return this.service.addEvent(id, eventType, payload, req.user?.id, req.tenantContext.getTenantId());
  }

  @Get(':id/events')
  @CheckAbility({ action: 'read', subject: 'VasExecutionTask' })
  @ApiOperation({ summary: 'Get VAS task event timeline' })
  async getEvents(@Param('id') id: string, @Req() req: any) {
    return this.service.getEvents(id, req.tenantContext.getTenantId());
  }
}
