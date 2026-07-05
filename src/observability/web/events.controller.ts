import { Controller, Get, Param, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { EventService } from '../events/event.service';

@ApiTags('Observability')
@Controller('web/events')
@UseGuards(JwtAuthGuard, CaslGuard)
export class EventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'WarehouseEvent' })
  @ApiOperation({ summary: 'List warehouse events (filterable by type, severity, objectType, dateRange)' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.eventService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'WarehouseEvent' })
  @ApiOperation({ summary: 'Get warehouse event by ID' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.eventService.findById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'WarehouseEvent' })
  @ApiOperation({ summary: 'Delete warehouse event' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.eventService.delete(tenantId, BigInt(id));
  }
}
