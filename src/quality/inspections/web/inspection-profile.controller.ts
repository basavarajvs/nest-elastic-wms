import { Controller, Post, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { InspectionProfileService } from '../inspection-profile.service';
import { InspectionProfileDto, InspectionChecklistItemDto, ProductInspectionProfileDto, CreateInspectionProfileDto, UpdateInspectionProfileDto, AssignProductToProfileDto } from '../../dtos/inspection-profile.dto';

@ApiTags('Quality')
@Controller('web/inspection-profiles')
@UseGuards(JwtAuthGuard, CaslGuard)
export class InspectionProfileWebController {
  constructor(private readonly inspectionProfileService: InspectionProfileService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @ApiCreatedResponse({ type: InspectionProfileDto })
  @CheckAbility({ action: 'create', subject: 'InspectionProfile' })
  async create(@Req() req: any, @Body() dto: CreateInspectionProfileDto) {
    return this.inspectionProfileService.create(this.getTenant(req), dto);
  }

  @Get()
  @ApiOkResponse({ type: [InspectionProfileDto] })
  @CheckAbility({ action: 'read', subject: 'InspectionProfile' })
  async findAll(@Req() req: any) {
    return this.inspectionProfileService.findAll(this.getTenant(req));
  }

  @Get(':id')
  @ApiOkResponse({ type: InspectionProfileDto })
  @CheckAbility({ action: 'read', subject: 'InspectionProfile' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.inspectionProfileService.findById(this.getTenant(req), BigInt(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: InspectionProfileDto })
  @CheckAbility({ action: 'update', subject: 'InspectionProfile' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateInspectionProfileDto) {
    return this.inspectionProfileService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Post('assign-product')
  @ApiCreatedResponse({ type: ProductInspectionProfileDto })
  @CheckAbility({ action: 'create', subject: 'InspectionProfile' })
  async assignToProduct(@Req() req: any, @Body() dto: AssignProductToProfileDto) {
    return this.inspectionProfileService.assignToProduct(this.getTenant(req), dto);
  }

  @Get('by-product/:productId')
  @ApiOkResponse({ type: InspectionProfileDto })
  @CheckAbility({ action: 'read', subject: 'InspectionProfile' })
  async getForProduct(@Req() req: any, @Param('productId') productId: string, @Query('vendorId') vendorId?: string) {
    return this.inspectionProfileService.getProfileForProduct(
      this.getTenant(req),
      BigInt(productId),
      vendorId ? BigInt(vendorId) : undefined,
    );
  }
}
