import { Controller, Post, Get, Param, Body, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { DamageCodeService } from '../damage-code.service';

@Controller('web/damage-codes')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DamageCodeWebController {
  constructor(private readonly damageCodeService: DamageCodeService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'DamageCode' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.damageCodeService.create(this.getTenant(req), dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'DamageCode' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.damageCodeService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'DamageCode' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.damageCodeService.findById(this.getTenant(req), BigInt(id));
  }

  @Post(':id')
  @CheckAbility({ action: 'update', subject: 'DamageCode' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.damageCodeService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'DamageCode' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.damageCodeService.delete(this.getTenant(req), BigInt(id));
  }

  @Post('seed')
  @CheckAbility({ action: 'create', subject: 'DamageCode' })
  async seed(@Req() req: any) {
    return this.damageCodeService.seedDefaults(this.getTenant(req));
  }
}
