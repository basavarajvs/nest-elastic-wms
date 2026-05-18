import { Injectable, Logger } from '@nestjs/common';
import { StateMachineService } from './state-machine.service';
import { RuleEngineService } from './rule-engine.service';
import { BpmnService } from './bpmn.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new Logger(WorkflowOrchestratorService.name);
  private readonly serviceTaskHandlers = new Map<string, (context: any, tenantId: string) => Promise<any>>();

  constructor(
    private readonly stateMachineService: StateMachineService,
    private readonly ruleEngineService: RuleEngineService,
    private readonly bpmnService: BpmnService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {
    this.registerCoreHandlers();
  }

  registerServiceTaskHandler(taskName: string, handler: (context: any, tenantId: string) => Promise<any>) {
    this.serviceTaskHandlers.set(taskName, handler);
  }

  private registerCoreHandlers() {
    this.registerServiceTaskHandler('evaluateRule', async (ctx: any, tenantId: string) => {
      return this.ruleEngineService.evaluateRule(ctx.ruleKey, ctx.inputData, tenantId, ctx.contextKeys);
    });

    this.registerServiceTaskHandler('transitionStateMachine', async (ctx: any, tenantId: string) => {
      return this.stateMachineService.executeTransition(
        ctx.machineKey, ctx.entityType, ctx.entityId, ctx.event, ctx.context || {}, tenantId,
      );
    });

    this.registerServiceTaskHandler('checkInventory', async (ctx: any, tenantId: string) => {
      const onHand = await (this.prisma as any).inventoryOnHand.findMany({
        where: { tenantId, productId: ctx.productId },
      });
      const total = onHand.reduce((sum: number, r: any) => sum + Number(r.quantityOnHand), 0);
      return { totalOnHand: total, sufficient: total >= (ctx.requiredQuantity || 0) };
    });

    this.registerServiceTaskHandler('createAuditLog', async (ctx: any, tenantId: string) => {
      this.eventEmitter.emit('wms.audit.log', { ...ctx, tenantId, timestamp: new Date() });
      return { logged: true };
    });
  }

  async executeOrchestration(
    processKey: string,
    entityType: string,
    entityId: string,
    context: Record<string, any>,
    tenantId: string,
  ) {
    this.logger.log(`Orchestration start: ${processKey} for ${entityType}:${entityId}`);

    const bpmnResult = await this.bpmnService.startProcess(processKey, context, entityType, entityId, tenantId);
    const executionId = bpmnResult.executionId;

    if (context.ruleKey) {
      const ruleResult = await this.ruleEngineService.evaluateRule(context.ruleKey, context.inputData || {}, tenantId, context.contextKeys);
      const machineKey = ruleResult.stateMachine || `${entityType.toLowerCase()}_lifecycle`;

      await this.stateMachineService.executeTransition(
        machineKey, entityType, entityId, ruleResult.action || 'START', { ...context, orchestrationRule: ruleResult }, tenantId,
      );
    }

    if (context.signalOnComplete) {
      await this.bpmnService.signalEvent(executionId, context.signalOnComplete, { orchestrated: true }, tenantId);
    }

    this.eventEmitter.emit('wms.orchestration.completed', {
      executionId, processKey, entityType, entityId, tenantId,
    });

    return { executionId, status: 'ORCHESTRATED' };
  }

  async handleServiceTask(taskName: string, context: any, tenantId: string): Promise<any> {
    const handler = this.serviceTaskHandlers.get(taskName);
    if (!handler) {
      this.logger.warn(`No handler registered for service task: ${taskName}`);
      return { error: `Unknown service task: ${taskName}` };
    }
    return handler(context, tenantId);
  }
}
