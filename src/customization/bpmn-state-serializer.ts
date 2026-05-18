import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Challenge 1: BpmnStateSerializer
 * Hooks into bpmn-engine token lifecycle to persist active tokens and context
 * to WmsExecutionInstance.contextJson on every await point.
 */
@Injectable()
export class BpmnStateSerializer {
  private readonly logger = new Logger(BpmnStateSerializer.name);

  constructor(private readonly prisma: PrismaService) {}

  createTokenHandler(executionId: string, tenantId: string) {
    return {
      onToken: async (token: any) => {
        await this.persist(executionId, {
          tokenId: token.id,
          elementId: token.elementId,
          type: token.type,
          status: token.status,
          timestamp: new Date().toISOString(),
        });
      },
      onActivityEnd: async (activity: any) => {
        await this.appendActivity(executionId, activity);
      },
      onError: async (error: any) => {
        await this.recordError(executionId, error);
      },
    };
  }

  private async persist(executionId: string, tokenData: any) {
    await (this.prisma as any).wmsExecutionInstance.update({
      where: { id: executionId },
      data: {
        currentState: `TOKEN:${tokenData.elementId}:${tokenData.status}`,
        contextJson: { lastToken: tokenData, persistedAt: new Date().toISOString() },
      },
    });
  }

  private async appendActivity(executionId: string, activity: any) {
    const instance = await (this.prisma as any).wmsExecutionInstance.findFirst({ where: { id: executionId } });
    if (!instance) return;
    const ctx = (instance.contextJson as any) || {};
    const completed = ctx.completedActivities || [];
    completed.push({ elementId: activity.elementId || activity.id, type: activity.type, completedAt: new Date().toISOString() });
    await (this.prisma as any).wmsExecutionInstance.update({
      where: { id: executionId },
      data: { contextJson: { ...ctx, completedActivities: completed } },
    });
  }

  private async recordError(executionId: string, error: any) {
    await (this.prisma as any).wmsExecutionInstance.update({
      where: { id: executionId },
      data: {
        status: 'ERROR',
        errorDetails: error.message || JSON.stringify(error),
      },
    });
  }

  async resumeProcess(executionId: string, tenantId: string): Promise<any> {
    const instance = await (this.prisma as any).wmsExecutionInstance.findFirst({
      where: { id: executionId, tenantId },
    });
    if (!instance) throw new Error('Execution instance not found');
    if (instance.status !== 'RUNNING' && instance.status !== 'SUSPENDED') {
      throw new Error(`Cannot resume execution in status ${instance.status}`);
    }

    const context = (instance.contextJson as any) || {};
    const lastToken = context.lastToken;
    const completedActivities = context.completedActivities || [];

    return {
      instanceId: instance.id,
      resumedFrom: lastToken?.elementId || 'START',
      completedActivities,
      context: { ...context, resumed: true },
      engineKey: instance.engineKey,
      engineVersion: instance.engineVersion,
    };
  }
}
