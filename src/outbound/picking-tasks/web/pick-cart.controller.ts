import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { PickCartService } from '../pick-cart.service';
import { PickCartDto, CreatePickCartDto, UpdatePickCartDto } from '../dtos/response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Pick Carts')
@Controller('web/pick-carts')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PickCartController {
  constructor(private readonly service: PickCartService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'PickCart' })
  @ApiOperation({ summary: 'Create pick cart' })
  @ApiCreatedResponse({ type: PickCartDto })
  async create(@Req() req: any, @Body() dto: CreatePickCartDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'PickCart' })
  @ApiOperation({ summary: 'List pick carts' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'PickCart' })
  @ApiOperation({ summary: 'Get pick cart' })
  @ApiOkResponse({ type: PickCartDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'PickCart' })
  @ApiOperation({ summary: 'Update pick cart' })
  @ApiOkResponse({ type: PickCartDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePickCartDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'PickCart' })
  @ApiOperation({ summary: 'Delete pick cart' })
  @ApiOkResponse({ type: PickCartDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
