import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  StorageLocationService,
  Projection,
} from './storage-location.service';
import { CreateLocationDto } from './dtos/create-location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { LocationQueryDto } from './dtos/location-query.dto';
import { QuotaCheck } from '../common/decorators/quota-check.decorator';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { QuotaGuard } from '../common/guards/quota.guard';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from '../common/guards/rf-session.guard';
import { RfAction } from '../common/guards/rf-action.decorator';

@Controller()
export class StorageLocationController {
  constructor(private readonly locationService: StorageLocationService) {}

  // ── WEB Routes ──
  @Get('web')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  async findAllWeb(@Req() req: any, @Query() query: LocationQueryDto) {
    return this.locationService.list(req.tenantContext.getTenantId(), query, Projection.WEB);
  }

  @Get('web/by-code/:code')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  async findByCodeWeb(
    @Req() req: any,
    @Query('facilityId') facilityId: string,
    @Param('code') code: string,
  ) {
    return this.locationService.findByCode(
      req.tenantContext.getTenantId(),
      facilityId,
      code,
      Projection.WEB,
    );
  }

  @Post('web')
  @UseGuards(CaslGuard, QuotaGuard)
  @QuotaCheck('locations')
  @CheckAbility({ action: 'create', subject: 'StorageLocation' })
  async createWeb(@Req() req: any, @Body() dto: CreateLocationDto) {
    return this.locationService.create(dto, req.tenantContext.getTenantId());
  }

  @Patch('web/:id')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'update', subject: 'StorageLocation' })
  async updateWeb(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.update(
      id,
      req.tenantContext.getTenantId(),
      dto,
    );
  }

  @Get('web/:id/children')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'StorageLocation' })
  async getChildrenWeb(@Req() req: any, @Param('id') id: string) {
    return this.locationService.getChildren(
      id,
      req.tenantContext.getTenantId(),
    );
  }

  // ── RF Routes ──
  @Get('rf')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findAllRf(@Req() req: any, @Query() query: LocationQueryDto) {
    return this.locationService.list(req.tenantContext.getTenantId(), query, Projection.RF);
  }

  @Get('rf/by-code/:code')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findByCodeRf(
    @Req() req: any,
    @Query('facilityId') facilityId: string,
    @Param('code') code: string,
  ) {
    return this.locationService.findByCode(
      req.tenantContext.getTenantId(),
      facilityId,
      code,
      Projection.RF,
    );
  }
}
