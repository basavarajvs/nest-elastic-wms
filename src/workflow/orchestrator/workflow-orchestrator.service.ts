import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StateMachineService } from '../state-machine/state-machine.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { BpmnService } from '../bpmn/bpmn.service';

interface OrchestrationContext {
  tenantId: string;
  userId: string;
  processKey?: string;
  ruleKey?: string;
  machineKey?: string;
  entityType?: string;
  entityId?: string;
  input?: Record<string, any>;
}

@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new Logger(WorkflowOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachineService: StateMachineService,
    private readonly ruleEngineService: RuleEngineService,
    private readonly bpmnService: BpmnService,
    @InjectQueue('workflow-recovery') private readonly recoveryQueue: Queue,
  ) {}

  async executeServiceTask(
    taskType: string,
    context: OrchestrationContext,
  ): Promise<any> {
    switch (taskType) {
      case 'evaluateRule':
        return this.ruleEngineService.evaluate(
          context.tenantId,
          context.ruleKey!,
          context.input || {},
        );

      case 'transitionStateMachine':
        return this.stateMachineService.execute(
          context.tenantId,
          context.userId,
          context.machineKey!,
          context.entityType!,
          context.entityId!,
          context.input || {},
        );

      case 'checkInventory':
        return this.checkInventory(context);

      case 'createAuditLog':
        return this.createAuditLog(context);

      default:
        throw new Error(`Unknown service task type: ${taskType}`);
    }
  }

  async orchestrate(
    tenantId: string,
    userId: string,
    pipeline: { taskType: string; context: OrchestrationContext }[],
  ): Promise<any[]> {
    const results: any[] = [];

    for (const step of pipeline) {
      const stepContext: OrchestrationContext = {
        ...step.context,
        tenantId,
        userId,
      };

      try {
        const result = await this.executeServiceTask(
          step.taskType,
          stepContext,
        );
        results.push({ taskType: step.taskType, status: 'completed', result });
      } catch (err) {
        this.logger.error(
          `Pipeline step ${step.taskType} failed: ${(err as Error).message}`,
        );
        results.push({
          taskType: step.taskType,
          status: 'failed',
          error: (err as Error).message,
        });
        break;
      }
    }

    return results;
  }

  private async checkInventory(context: OrchestrationContext): Promise<any> {
    const { tenantId, input } = context;
    const sku = input?.sku;
    const facilityId = input?.facilityId;

    if (!sku || !facilityId) {
      throw new Error('checkInventory requires sku and facilityId in input');
    }

    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM inventory_on_hand
       WHERE tenant_id = $1 AND sku = $2 AND facility_id = $3
       LIMIT 1`,
      tenantId,
      sku,
      facilityId,
    );

    return {
      available: result.length > 0 ? Number(result[0].quantity) : 0,
      sku,
      facilityId,
    };
  }

  private async createAuditLog(context: OrchestrationContext): Promise<any> {
    const { tenantId, userId, input } = context;

    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO system_audit_log (tenant_id, entity_type, entity_id, action, description, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      tenantId,
      input?.entityType || 'workflow',
      input?.entityId || 'unknown',
      input?.action || 'workflow.execute',
      input?.description || 'Workflow orchestration step executed',
      userId,
    );

    return result[0];
  }

  @Cron(CronExpression.EVERY_HOUR)
  async recoverStaleInstances(): Promise<void> {
    this.logger.log('Running workflow recovery check');

    try {
      const staleCutoff = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const staleExecutions = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, tenant_id, machine_key, entity_type, entity_id, current_state, status
         FROM wms_execution_instances
         WHERE status = 'RUNNING' AND updated_at < $1::timestamp`,
        staleCutoff,
      );

      for (const exec of staleExecutions) {
        await this.prisma.$queryRawUnsafe(
          `UPDATE wms_execution_instances
           SET status = 'SUSPENDED', updated_at = NOW()
           WHERE id = $1 AND status = 'RUNNING'`,
          exec.id,
        );

        this.logger.warn(
          `Suspended stale execution instance ${exec.id} (${exec.machine_key})`,
        );

        await this.recoveryQueue.add('recover-instance', {
          instanceId: exec.id,
          tenantId: exec.tenant_id,
          machineKey: exec.machine_key,
        });
      }

      const staleBpmn = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, tenant_id, process_key
         FROM wms_bpmn_executions
         WHERE status = 'RUNNING' AND updated_at < $1::timestamp`,
        staleCutoff,
      );

      for (const exec of staleBpmn) {
        await this.prisma.$queryRawUnsafe(
          `UPDATE wms_bpmn_executions
           SET status = 'SUSPENDED', updated_at = NOW()
           WHERE id = $1 AND status = 'RUNNING'`,
          exec.id,
        );

        this.logger.warn(
          `Suspended stale BPMN execution ${exec.id} (${exec.process_key})`,
        );

        await this.recoveryQueue.add('recover-instance', {
          instanceId: exec.id,
          tenantId: exec.tenant_id,
          processKey: exec.process_key,
          type: 'bpmn',
        });
      }
    } catch (err) {
      this.logger.error(`Recovery check failed: ${(err as Error).message}`);
    }
  }
}
