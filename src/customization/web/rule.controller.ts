import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RuleEngineService } from '../rule-engine.service';
import { UpsertRuleDto, EvaluateRuleDto } from '../dtos/customization.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { SetEngineType } from '../engine-resource.guard';

@ApiTags('Admin')
@Controller('web/customization/rules')
@UseGuards(CaslGuard)
export class WmsRuleController {
  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'WmsRule' })
  async list(@Req() req: any) {
    return (this.ruleEngineService as any).prisma?.wmsRule?.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    }) || [];
  }

  @Get(':key')
  @CheckAbility({ action: 'read', subject: 'WmsRule' })
  async get(@Req() req: any, @Param('key') key: string) {
    return this.ruleEngineService.getDefinition(key, req.tenantContext.getTenantId());
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'WmsRule' })
  async create(@Req() req: any, @Body() dto: UpsertRuleDto) {
    return this.ruleEngineService.upsertRule(dto, req.tenantContext.getTenantId());
  }

  @Patch(':key')
  @CheckAbility({ action: 'update', subject: 'WmsRule' })
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: Partial<UpsertRuleDto>) {
    return this.ruleEngineService.upsertRule(
      { ruleKey: key, ruleType: dto.ruleType || '', definitionJson: dto.definitionJson || {} },
      req.tenantContext.getTenantId(),
    );
  }

  @Post(':key/evaluate')
  @SetEngineType('JDM')
  @CheckAbility({ action: 'read', subject: 'WmsRule' })
  async evaluate(@Req() req: any, @Param('key') key: string, @Body() dto: EvaluateRuleDto) {
    return this.ruleEngineService.evaluateRule(key, dto.inputData, req.tenantContext.getTenantId(), dto.contextKeys);
  }

  @Post(':key/rollback/:version')
  @CheckAbility({ action: 'update', subject: 'WmsRule' })
  async rollback(@Req() req: any, @Param('key') key: string, @Param('version') version: string) {
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum)) throw new Error('Invalid version');

    const target = await (this.ruleEngineService as any).prisma?.wmsRule?.findFirst({
      where: { tenantId: req.tenantContext.getTenantId(), ruleKey: key, version: versionNum },
    });
    if (!target) throw new Error('Version not found');

    return this.ruleEngineService.upsertRule(
      { ruleKey: key, ruleType: target.ruleType, definitionJson: target.definitionJson },
      req.tenantContext.getTenantId(),
    );
  }
}
