import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryReservationsService } from '../inventory-reservations.service';
import { CreateReservationDto, ReleaseReservationDto, UpdateReservationDto } from '../dtos/create-reservation.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Inventory')
@Controller('web/inventory-reservations')
@UseGuards(CaslGuard)
export class InventoryReservationsWebController {
  constructor(private readonly service: InventoryReservationsService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'Create inventory reservation' })
  async create(@Req() req: any, @Body() dto: CreateReservationDto) {
    return this.service.create(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'List reservations' })
  async findAll(
    @Req() req: any,
    @Query('facilityId') facilityId: string,
    @Query('status') status: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), facilityId, status);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'Get reservation by id' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'Update reservation' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, req.tenantContext.getTenantId(), dto as any);
  }

  @Post(':id/release')
  @CheckAbility({ action: 'update', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'Release reservation' })
  async release(@Req() req: any, @Param('id') id: string) {
    return this.service.release(id, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'InventoryReservation' })
  @ApiOperation({ summary: 'Delete reservation' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }
}
