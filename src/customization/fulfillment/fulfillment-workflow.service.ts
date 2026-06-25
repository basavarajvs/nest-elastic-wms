import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FulfillmentWorkflowService {
  private readonly logger = new Logger(FulfillmentWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recordEvent(params: {
    tenantId: string;
    instanceId: string;
    eventType: string;
    eventPayload?: any;
    recordedBy?: string;
  }): Promise<any> {
    const event = await this.prisma.fulfillmentWorkflowEvent.create({
      data: {
        tenantId: params.tenantId,
        instanceId: params.instanceId,
        eventType: params.eventType,
        eventPayload: params.eventPayload ?? undefined,
        recordedBy: params.recordedBy,
      },
    });

    this.eventEmitter.emit('fulfillment.workflow.event', event);
    return event;
  }

  async recordTransition(params: {
    tenantId: string;
    instanceId: string;
    fromState?: string;
    toState: string;
    transition: string;
    context?: any;
    triggeredBy?: string;
  }): Promise<any> {
    const transition = await this.prisma.fulfillmentWorkflowTransition.create({
      data: {
        tenantId: params.tenantId,
        instanceId: params.instanceId,
        fromState: params.fromState,
        toState: params.toState,
        transition: params.transition,
        context: params.context ?? undefined,
        triggeredBy: params.triggeredBy,
      },
    });

    this.eventEmitter.emit('fulfillment.workflow.transition', transition);
    return transition;
  }

  async getEvents(instanceId: string, tenantId: string): Promise<any[]> {
    const instance = await this.prisma.wmsExecutionInstance.findFirst({
      where: { id: instanceId, tenantId },
    });
    if (!instance) throw new NotFoundException('Execution instance not found');

    return this.prisma.fulfillmentWorkflowEvent.findMany({
      where: { instanceId, tenantId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getTransitions(instanceId: string, tenantId: string): Promise<any[]> {
    const instance = await this.prisma.wmsExecutionInstance.findFirst({
      where: { id: instanceId, tenantId },
    });
    if (!instance) throw new NotFoundException('Execution instance not found');

    return this.prisma.fulfillmentWorkflowTransition.findMany({
      where: { instanceId, tenantId },
      orderBy: { triggeredAt: 'asc' },
    });
  }
}
