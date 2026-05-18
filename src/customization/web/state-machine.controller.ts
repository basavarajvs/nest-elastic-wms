import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { StateMachineService } from '../state-machine.service';
import { ExecuteTransitionDto, UpsertStateMachineDto } from '../dtos/customization.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { StateMachineAuditInterceptor } from '../state-machine-audit.interceptor';
import { SetEngineType } from '../engine-resource.guard';

@ApiTags('Admin')
@Controller('web/customization/state-machines')
@UseGuards(CaslGuard)
@UseInterceptors(StateMachineAuditInterceptor)
export class WmsStateMachineController {
  constructor(private readonly stateMachineService: StateMachineService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'WmsStateMachine' })
  async list(@Req() req: any, @Query('entityType') entityType?: string) {
    const where: any = { tenantId: req.tenantContext.getTenantId() };
    if (entityType) where.entityType = entityType;
    return (req.prisma || this.stateMachineService as any).prisma?.wmsStateMachine?.findMany({ where, orderBy: { createdAt: 'desc' } }) || [];
  }

  @Get(':key')
  @CheckAbility({ action: 'read', subject: 'WmsStateMachine' })
  async get(@Req() req: any, @Param('key') key: string) {
    return this.stateMachineService.getDefinition(key, req.tenantContext.getTenantId());
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'WmsStateMachine' })
  async create(@Req() req: any, @Body() dto: UpsertStateMachineDto) {
    return this.stateMachineService.upsertMachine(dto, req.tenantContext.getTenantId());
  }

  @Patch(':key')
  @CheckAbility({ action: 'update', subject: 'WmsStateMachine' })
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: Partial<UpsertStateMachineDto>) {
    return this.stateMachineService.upsertMachine(
      { machineKey: key, entityType: dto.entityType || '', definitionJson: dto.definitionJson || {} },
      req.tenantContext.getTenantId(),
    );
  }

  @Post(':key/validate')
  @CheckAbility({ action: 'read', subject: 'WmsStateMachine' })
  async validate(@Req() req: any, @Body('definition') definition: any) {
    await this.stateMachineService.validateDefinition(definition);
    return { valid: true };
  }

  @Post(':key/test')
  @SetEngineType('XSTATE')
  @CheckAbility({ action: 'read', subject: 'WmsStateMachine' })
  async testTransition(@Req() req: any, @Param('key') key: string, @Body() dto: ExecuteTransitionDto) {
    const result = await this.stateMachineService.executeTransition(
      key, dto.entityType, dto.entityId, dto.event, dto.context || {}, req.tenantContext.getTenantId(),
    );
    return result;
  }

  @Post(':key/rollback/:version')
  @CheckAbility({ action: 'update', subject: 'WmsStateMachine' })
  async rollback(@Req() req: any, @Param('key') key: string, @Param('version') version: string) {
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum)) throw new Error('Invalid version');

    const target = await (req.prisma || this.stateMachineService as any).prisma?.wmsStateMachine?.findFirst({
      where: { tenantId: req.tenantContext.getTenantId(), machineKey: key, version: versionNum },
    });
    if (!target) throw new Error('Version not found');

    return this.stateMachineService.upsertMachine(
      { machineKey: key, entityType: target.entityType, definitionJson: target.definitionJson },
      req.tenantContext.getTenantId(),
    );
  }
}
