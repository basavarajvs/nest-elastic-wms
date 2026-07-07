import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { ShortPickReasonService } from '../short-pick-reason.service';
import { ShortPickReasonDto, CreateShortPickReasonDto, UpdateShortPickReasonDto } from '../dtos/response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Short Pick Reasons')
@Controller('web/short-pick-reasons')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ShortPickReasonController {
  constructor(private readonly service: ShortPickReasonService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ShortPickReason' })
  @ApiOperation({ summary: 'Create short pick reason' })
  @ApiCreatedResponse({ type: ShortPickReasonDto })
  async create(@Req() req: any, @Body() dto: CreateShortPickReasonDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ShortPickReason' })
  @ApiOperation({ summary: 'List short pick reasons' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ShortPickReason' })
  @ApiOperation({ summary: 'Get short pick reason' })
  @ApiOkResponse({ type: ShortPickReasonDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ShortPickReason' })
  @ApiOperation({ summary: 'Update short pick reason' })
  @ApiOkResponse({ type: ShortPickReasonDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShortPickReasonDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ShortPickReason' })
  @ApiOperation({ summary: 'Delete short pick reason' })
  @ApiOkResponse({ type: ShortPickReasonDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
