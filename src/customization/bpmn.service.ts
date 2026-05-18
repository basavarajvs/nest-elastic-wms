import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const CACHE_TTL = 300;
const CACHE_PREFIX = 'wms:bpmn:';
const EXECUTION_TIMEOUT = 60_000;

@Injectable()
export class BpmnService {
  private readonly logger = new Logger(BpmnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async upsertProcess(dto: { processKey: string; bpmnXml: string }, tenantId: string) {
    await this.validateBpmnXml(dto.bpmnXml);

    const existing = await (this.prisma as any).wmsBpmnProcess.findFirst({
      where: { tenantId, processKey: dto.processKey, isActive: true },
      orderBy: { version: 'desc' },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    return (this.prisma as any).$transaction(async (tx: any) => {
      if (existing) {
        await tx.wmsBpmnProcess.updateMany({
          where: { tenantId, processKey: dto.processKey, isActive: true },
          data: { isActive: false },
        });
      }

      const process = await tx.wmsBpmnProcess.create({
        data: {
          tenantId,
          processKey: dto.processKey,
          version: newVersion,
          bpmnXml: dto.bpmnXml,
          isActive: true,
        },
      });

      await this.redis.del(`${CACHE_PREFIX}${tenantId}:${dto.processKey}`);
      return process;
    });
  }

  async startProcess(
    processKey: string,
    initialContext: Record<string, any>,
    entityType: string,
    entityId: string,
    tenantId: string,
  ) {
    const process = await this.getDefinition(processKey, tenantId);

    const instance = await (this.prisma as any).wmsExecutionInstance.create({
      data: {
        tenantId,
        entityType,
        entityId,
        engineType: 'BPMN_PROCESS',
        engineKey: processKey,
        engineVersion: process.version,
        currentState: 'STARTED',
        contextJson: { ...initialContext, tokens: [], completedActivities: [] },
        status: 'RUNNING',
      },
    });

    this.eventEmitter.emit('wms.bpmn.started', {
      instanceId: instance.id,
      processKey,
      entityType,
      entityId,
      tenantId,
    });

    return { executionId: instance.id, status: 'RUNNING' };
  }

  async signalEvent(
    executionId: string,
    messageName: string,
    context: Record<string, any>,
    tenantId: string,
  ) {
    const instance = await (this.prisma as any).wmsExecutionInstance.findFirst({
      where: { id: executionId, tenantId },
    });
    if (!instance) throw new BadRequestException('Execution instance not found');
    if (instance.status !== 'RUNNING') throw new BadRequestException('Execution is not RUNNING');

    const currentContext = (instance.contextJson as Record<string, any>) || {};
    const updatedContext = {
      ...currentContext,
      lastSignal: { messageName, timestamp: new Date().toISOString(), payload: context },
      completedActivities: [...(currentContext.completedActivities || []), `signal:${messageName}`],
    };

    await (this.prisma as any).wmsExecutionInstance.update({
      where: { id: executionId },
      data: { contextJson: updatedContext, currentState: `SIGNALED:${messageName}` },
    });

    this.eventEmitter.emit('wms.bpmn.signal', {
      instanceId: executionId,
      messageName,
      tenantId,
    });

    return { executionId, signaled: messageName };
  }

  async getDefinition(processKey: string, tenantId: string) {
    const cacheKey = `${CACHE_PREFIX}${tenantId}:${processKey}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const process = await (this.prisma as any).wmsBpmnProcess.findFirst({
      where: { tenantId, processKey, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!process) throw new BadRequestException(`BPMN process '${processKey}' not found`);

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(process));
    return process;
  }

  async parseBpmn(xml: string): Promise<any> {
    try {
      const { default: BpmnModdle } = await import('bpmn-moddle');
      const moddle = new BpmnModdle();
      const { rootElement } = await moddle.fromXML(xml);
      return { elements: (rootElement as any)?.rootElements || [], definitions: rootElement };
    } catch (err: any) {
      throw new BadRequestException(`BpmnParseError: ${err.message}`);
    }
  }

  private async validateBpmnXml(xml: string) {
    if (xml.includes('camunda:scriptTask') || xml.includes('scriptTask')) {
      throw new BadRequestException('UnsupportedBpmnElementType: scriptTask is not allowed');
    }
    if (xml.includes('camunda:externalTask') && (xml.includes('java:') || xml.includes('js:'))) {
      throw new BadRequestException('UnsupportedBpmnElementType: external task with Java/JS references');
    }

    try {
      const { default: BpmnModdle } = await import('bpmn-moddle');
      const moddle = new BpmnModdle();
      await moddle.fromXML(xml);
    } catch (err: any) {
      throw new BadRequestException(`BpmnValidationError: ${err.message}`);
    }

    const depth = this.measureBpmnDepth(xml);
    if (depth > 50) {
      throw new BadRequestException('BpmnTooDeep: maximum element nesting depth is 50');
    }
  }

  private measureBpmnDepth(xml: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    const openTagRe = /<(\w[\w.-]*)(?:\s[^>]*)?>/g;
    const closeTagRe = /<\/(\w[\w.-]*)>/g;
    const voidElements = new Set(['br', 'hr', 'img', 'input', 'link', 'meta']);

    const cleaned = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?.+?\?>/g, '');
    const tokens: Array<{ tag: string; isClose: boolean }> = [];
    let m: RegExpExecArray | null;

    const openRe = /<(\w[\w.-]*)(?:\s[^>]*)?\/?>/g;
    while ((m = openRe.exec(cleaned)) !== null) {
      if (m[0].endsWith('/>')) continue;
      if (voidElements.has(m[1])) continue;
      tokens.push({ tag: m[1], isClose: false });
    }
    const closeRe = /<\/(\w[\w.-]*)>/g;
    while ((m = closeRe.exec(cleaned)) !== null) {
      tokens.push({ tag: m[1], isClose: true });
    }

    for (const token of tokens) {
      if (token.isClose) {
        currentDepth = Math.max(0, currentDepth - 1);
      } else {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    }
    return maxDepth;
  }

  async recoverSuspended() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stuck = await (this.prisma as any).wmsExecutionInstance.findMany({
      where: {
        engineType: 'BPMN_PROCESS',
        status: 'RUNNING',
        startedAt: { lt: cutoff },
      },
    });

    for (const inst of stuck) {
      await (this.prisma as any).wmsExecutionInstance.update({
        where: { id: inst.id },
        data: { status: 'SUSPENDED', errorDetails: 'Auto-suspended by BpmnRecoveryJob (running > 24h)' },
      });
      this.eventEmitter.emit('wms.bpmn.suspended', {
        instanceId: inst.id,
        processKey: inst.engineKey,
        tenantId: inst.tenantId,
      });
    }
    return stuck.length;
  }
}
