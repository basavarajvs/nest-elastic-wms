import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { BpmnService } from '../bpmn.service';
import { UpsertBpmnProcessDto, StartProcessDto, SignalProcessDto } from '../dtos/customization.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { SetEngineType } from '../engine-resource.guard';

@ApiTags('Admin')
@Controller('web/customization/processes')
@UseGuards(CaslGuard)
export class WmsBpmnController {
  constructor(private readonly bpmnService: BpmnService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'WmsBpmnProcess' })
  async list(@Req() req: any) {
    return (this.bpmnService as any).prisma?.wmsBpmnProcess?.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    }) || [];
  }

  @Get(':key')
  @CheckAbility({ action: 'read', subject: 'WmsBpmnProcess' })
  async get(@Req() req: any, @Param('key') key: string) {
    return this.bpmnService.getDefinition(key, req.tenantContext.getTenantId());
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'WmsBpmnProcess' })
  async create(@Req() req: any, @Body() dto: UpsertBpmnProcessDto) {
    return this.bpmnService.upsertProcess(dto, req.tenantContext.getTenantId());
  }

  @Patch(':key')
  @CheckAbility({ action: 'update', subject: 'WmsBpmnProcess' })
  async update(@Req() req: any, @Param('key') key: string, @Body() dto: Partial<UpsertBpmnProcessDto>) {
    return this.bpmnService.upsertProcess(
      { processKey: key, bpmnXml: dto.bpmnXml || '' },
      req.tenantContext.getTenantId(),
    );
  }

  @Post(':key/parse')
  @CheckAbility({ action: 'read', subject: 'WmsBpmnProcess' })
  async parse(@Req() req: any, @Param('key') key: string, @Body('xml') xml?: string) {
    if (xml) return this.bpmnService.parseBpmn(xml);
    const process = await this.bpmnService.getDefinition(key, req.tenantContext.getTenantId());
    return this.bpmnService.parseBpmn(process.bpmnXml);
  }

  @Post(':key/simulate')
  @SetEngineType('BPMN')
  @CheckAbility({ action: 'read', subject: 'WmsBpmnProcess' })
  async simulate(@Req() req: any, @Param('key') key: string, @Body() dto: StartProcessDto) {
    return this.bpmnService.startProcess(key, dto.initialContext, dto.entityType, dto.entityId, req.tenantContext.getTenantId());
  }

  @Post(':key/rollback/:version')
  @CheckAbility({ action: 'update', subject: 'WmsBpmnProcess' })
  async rollback(@Req() req: any, @Param('key') key: string, @Param('version') version: string) {
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum)) throw new Error('Invalid version');

    const target = await (this.bpmnService as any).prisma?.wmsBpmnProcess?.findFirst({
      where: { tenantId: req.tenantContext.getTenantId(), processKey: key, version: versionNum },
    });
    if (!target) throw new Error('Version not found');

    return this.bpmnService.upsertProcess(
      { processKey: key, bpmnXml: target.bpmnXml },
      req.tenantContext.getTenantId(),
    );
  }
}
