import { Controller, Post, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { DefectCodeService } from '../defect-code.service';

@Controller('web/defect-codes')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DefectCodeWebController {
  constructor(private readonly defectCodeService: DefectCodeService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'DefectCode' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.defectCodeService.create(this.getTenant(req), dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'DefectCode' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.defectCodeService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'DefectCode' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.defectCodeService.findById(this.getTenant(req), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'DefectCode' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.defectCodeService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Post('seed')
  @CheckAbility({ action: 'create', subject: 'DefectCode' })
  async seed(@Req() req: any) {
    return this.defectCodeService.seedDefaults(this.getTenant(req));
  }
}
