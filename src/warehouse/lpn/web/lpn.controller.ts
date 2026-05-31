import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { LpnService } from '../lpn.service';
import { CreateLpnDto } from '../dtos/create-lpn.dto';
import { UpdateLpnDto } from '../dtos/update-lpn.dto';
import { LpnFilterDto } from '../dtos/lpn-filter.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/lpns')
@UseGuards(CaslGuard)
export class LpnWebController {
  constructor(private readonly lpnService: LpnService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'LPN' })
  async create(@Req() req: any, @Body() dto: CreateLpnDto) {
    return this.lpnService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async list(@Req() req: any, @Query() filter: LpnFilterDto) {
    return this.lpnService.list(req.tenantContext.getTenantId(), filter);
  }

  @Get('available')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async available(
    @Req() req: any,
    @Query('facilityId') facilityId: string,
  ) {
    return this.lpnService.findAvailable(facilityId, req.tenantContext.getTenantId());
  }

  @Get('available-for-shipment')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async availableForShipment(
    @Req() req: any,
    @Query('facilityId') facilityId: string,
  ) {
    return this.lpnService.findAvailableForShipment(facilityId, req.tenantContext.getTenantId());
  }

  @Get('product/:productId/available-quantity')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async productAvailableQty(
    @Req() req: any,
    @Param('productId') productId: string,
    @Query('facilityId') facilityId: string,
  ) {
    return this.lpnService.findProductAvailableQuantity(productId, facilityId, req.tenantContext.getTenantId());
  }

  @Get('by-number/:lpnNumber')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async findByNumber(@Req() req: any, @Param('lpnNumber') lpnNumber: string) {
    return this.lpnService.findByNumber(lpnNumber, req.tenantContext.getTenantId());
  }

  @Get('by-location/:locationId')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async findByLocation(@Req() req: any, @Param('locationId') locationId: string) {
    return this.lpnService.findByLocation(locationId, req.tenantContext.getTenantId());
  }

  @Get('by-grn-line/:grnLineId')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async findByGrnLineId(@Req() req: any, @Param('grnLineId') grnLineId: string) {
    return this.lpnService.findByGrnLine(grnLineId, req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.lpnService.findById(id, req.tenantContext.getTenantId());
  }

  @Get(':id/hierarchy')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async getHierarchy(@Req() req: any, @Param('id') id: string) {
    return this.lpnService.getHierarchy(id, req.tenantContext.getTenantId());
  }

  @Get(':id/children')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  async getChildren(@Req() req: any, @Param('id') id: string) {
    return this.lpnService.getChildren(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'LPN' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLpnDto) {
    return this.lpnService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Patch(':id/status')
  @CheckAbility({ action: 'update', subject: 'LPN' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.lpnService.update(id, req.tenantContext.getTenantId(), { status: status as any });
  }

  @Post(':childId/nest/:parentId')
  @ApiOperation({ summary: 'Nest child LPN into parent LPN' })
  @CheckAbility({ action: 'update', subject: 'LPN' })
  async nest(
    @Req() req: any,
    @Param('childId') childId: string,
    @Param('parentId') parentId: string,
  ) {
    return this.lpnService.nestLpn(childId, parentId, req.tenantContext.getTenantId());
  }

  @Post(':id/unnest')
  @ApiOperation({ summary: 'Unnest LPN from its parent' })
  @CheckAbility({ action: 'update', subject: 'LPN' })
  async unnest(@Req() req: any, @Param('id') id: string) {
    return this.lpnService.unnestLpn(id, req.tenantContext.getTenantId());
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move LPN to a different location' })
  @CheckAbility({ action: 'update', subject: 'LPN' })
  async move(
    @Req() req: any,
    @Param('id') id: string,
    @Body('locationId') locationId: string,
  ) {
    return this.lpnService.moveLpn(id, locationId, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'LPN' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.lpnService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
