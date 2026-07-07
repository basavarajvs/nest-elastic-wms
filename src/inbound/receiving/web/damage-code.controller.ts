import { Controller, Post, Get, Param, Body, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { DamageCodeService } from '../damage-code.service';
import { DamageCodeResponseDto, SeedResponseDto, CreateDamageCodeDto, UpdateDamageCodeDto } from '../dtos/receiving-response.dto';

@ApiTags('Damage Codes')
@Controller('web/damage-codes')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DamageCodeWebController {
  constructor(private readonly damageCodeService: DamageCodeService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @ApiOperation({ summary: 'Create a damage code' })
  @ApiCreatedResponse({ type: DamageCodeResponseDto })
  @CheckAbility({ action: 'create', subject: 'DamageCode' })
  async create(@Req() req: any, @Body() dto: CreateDamageCodeDto) {
    return this.damageCodeService.create(this.getTenant(req), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all damage codes' })
  @ApiOkResponse({ type: [DamageCodeResponseDto] })
  @CheckAbility({ action: 'read', subject: 'DamageCode' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.damageCodeService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get damage code by id' })
  @ApiOkResponse({ type: DamageCodeResponseDto })
  @CheckAbility({ action: 'read', subject: 'DamageCode' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.damageCodeService.findById(this.getTenant(req), BigInt(id));
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update a damage code' })
  @ApiOkResponse({ type: DamageCodeResponseDto })
  @CheckAbility({ action: 'update', subject: 'DamageCode' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDamageCodeDto) {
    return this.damageCodeService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a damage code' })
  @ApiOkResponse({ type: DamageCodeResponseDto })
  @CheckAbility({ action: 'delete', subject: 'DamageCode' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.damageCodeService.delete(this.getTenant(req), BigInt(id));
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default damage codes' })
  @ApiCreatedResponse({ type: SeedResponseDto })
  @CheckAbility({ action: 'create', subject: 'DamageCode' })
  async seed(@Req() req: any) {
    return this.damageCodeService.seedDefaults(this.getTenant(req));
  }
}
