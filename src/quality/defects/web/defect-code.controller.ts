import { Controller, Post, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { DefectCodeService } from '../defect-code.service';
import { DefectCodeDto, CreateDefectCodeDto, UpdateDefectCodeDto } from '../../dtos/defect-code.dto';
import { SeedResultDto } from '../../dtos/inspection.dto';

@ApiTags('Quality')
@Controller('web/defect-codes')
@UseGuards(JwtAuthGuard, CaslGuard)
export class DefectCodeWebController {
  constructor(private readonly defectCodeService: DefectCodeService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @ApiCreatedResponse({ type: DefectCodeDto })
  @CheckAbility({ action: 'create', subject: 'DefectCode' })
  async create(@Req() req: any, @Body() dto: CreateDefectCodeDto) {
    return this.defectCodeService.create(this.getTenant(req), dto);
  }

  @Get()
  @ApiOkResponse({ type: [DefectCodeDto] })
  @CheckAbility({ action: 'read', subject: 'DefectCode' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.defectCodeService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @ApiOkResponse({ type: DefectCodeDto })
  @CheckAbility({ action: 'read', subject: 'DefectCode' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.defectCodeService.findById(this.getTenant(req), BigInt(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: DefectCodeDto })
  @CheckAbility({ action: 'update', subject: 'DefectCode' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDefectCodeDto) {
    return this.defectCodeService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Post('seed')
  @ApiCreatedResponse({ type: SeedResultDto })
  @CheckAbility({ action: 'create', subject: 'DefectCode' })
  async seed(@Req() req: any) {
    return this.defectCodeService.seedDefaults(this.getTenant(req));
  }
}
