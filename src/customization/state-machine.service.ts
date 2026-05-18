import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { createMachine, createActor } from 'xstate';

const CACHE_TTL = 300;
const CACHE_PREFIX = 'wms:sm:';
const CONTEXT_RING_SIZE = 50;

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async upsertMachine(dto: { entityType: string; machineKey: string; definitionJson: any }, tenantId: string) {
    this.validateDefinition(dto.definitionJson);

    const existing = await (this.prisma as any).wmsStateMachine.findFirst({
      where: { tenantId, machineKey: dto.machineKey, isActive: true },
      orderBy: { version: 'desc' },
    });

    const newVersion = existing ? existing.version + 1 : 1;

    return (this.prisma as any).$transaction(async (tx: any) => {
      if (existing) {
        await tx.wmsStateMachine.updateMany({
          where: { tenantId, machineKey: dto.machineKey, isActive: true },
          data: { isActive: false },
        });
      }

      const machine = await tx.wmsStateMachine.create({
        data: {
          tenantId,
          entityType: dto.entityType,
          machineKey: dto.machineKey,
          version: newVersion,
          definitionJson: dto.definitionJson,
          isActive: true,
        },
      });

      await this.redis.del(`${CACHE_PREFIX}${tenantId}:${dto.machineKey}`);
      return machine;
    });
  }

  async getDefinition(machineKey: string, tenantId: string) {
    const cacheKey = `${CACHE_PREFIX}${tenantId}:${machineKey}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const machine = await (this.prisma as any).wmsStateMachine.findFirst({
      where: { tenantId, machineKey, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!machine) throw new BadRequestException(`State machine '${machineKey}' not found`);

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(machine));
    return machine;
  }

  async executeTransition(
    machineKey: string,
    entityType: string,
    entityId: string,
    event: string,
    context: Record<string, any>,
    tenantId: string,
  ) {
    const machineRec = await this.getDefinition(machineKey, tenantId);
    const machine = createMachine(machineRec.definitionJson);

    let instance = await (this.prisma as any).wmsExecutionInstance.findFirst({
      where: { tenantId, entityType, entityId, engineType: 'XSTATE_MACHINE', engineKey: machineKey, status: { in: ['RUNNING', 'SUSPENDED'] } },
    });

    const persisted = instance?.contextJson as Record<string, any> | null;
    const savedSnapshot = persisted?.__xstate_persisted;

    const actor = savedSnapshot
      ? createActor(machine, { snapshot: savedSnapshot })
      : createActor(machine);

    actor.start();

    const before = actor.getSnapshot();
    const fromState = before.value;

    actor.send({ type: event, ...context } as any);
    const next = actor.getSnapshot();

    const persistedSnapshot = actor.getPersistedSnapshot();
    const trimmedContext = this.trimContext({
      ...next.context,
      __xstate_value: next.value,
      __xstate_persisted: persistedSnapshot,
    });
    const statusStr: string = next.status === 'done' ? 'COMPLETED' : next.status === 'error' ? 'ERROR' : 'RUNNING';

    if (!instance) {
      instance = await (this.prisma as any).wmsExecutionInstance.create({
        data: {
          tenantId,
          entityType,
          entityId,
          engineType: 'XSTATE_MACHINE',
          engineKey: machineKey,
          engineVersion: machineRec.version,
          currentState: typeof next.value === 'string' ? next.value : JSON.stringify(next.value),
          contextJson: trimmedContext,
          status: statusStr as any,
          startedByUserId: context?.userId,
          completedAt: next.status === 'done' ? new Date() : null,
        },
      });
    } else {
      instance = await (this.prisma as any).wmsExecutionInstance.update({
        where: { id: instance.id },
        data: {
          currentState: typeof next.value === 'string' ? next.value : JSON.stringify(next.value),
          contextJson: trimmedContext,
          status: statusStr as any,
          completedAt: next.status === 'done' ? new Date() : null,
        },
      });
    }

    this.eventEmitter.emit('wms.statemachine.transition', {
      instanceId: instance.id,
      machineKey,
      entityType,
      entityId,
      event,
      fromState: typeof fromState === 'string' ? fromState : JSON.stringify(fromState),
      toState: typeof next.value === 'string' ? next.value : JSON.stringify(next.value),
      tenantId,
    });

    return {
      state: typeof next.value === 'string' ? next.value : next.value,
      context: next.context,
      done: next.status === 'done',
      instanceId: instance.id,
    };
  }

  async validateDefinition(definition: any) {
    const defStr = JSON.stringify(definition);
    if (defStr.includes('function') || defStr.includes('eval') || defStr.includes('new Function')) {
      throw new BadRequestException('UnsafeStateMachineDefinition: function injection detected');
    }
    if (definition?.invoke?.src && typeof definition.invoke.src === 'string' && (definition.invoke.src.includes('eval') || definition.invoke.src.includes('Function'))) {
      throw new BadRequestException('UnsafeStateMachineDefinition: unsafe invoke.src detected');
    }
    try {
      const machine = createMachine(definition);
      const actor = createActor(machine);
      actor.start();
      const snapshot = actor.getSnapshot();
      if (!snapshot || snapshot.value === undefined) {
        throw new BadRequestException('State machine definition must have a valid initial state');
      }
    } catch (err: any) {
      throw new BadRequestException(`InvalidXStateDefinition: ${err.message}`);
    }

    if (definition.states) {
      const depth = this.measureDepth(definition.states);
      if (depth > 20) {
        throw new BadRequestException('StateMachineTooDeep: maximum nesting depth is 20');
      }
    }
  }

  private measureDepth(states: Record<string, any>, currentDepth = 0): number {
    if (!states || currentDepth > 20) return currentDepth;
    let max = currentDepth;
    for (const state of Object.values(states)) {
      if ((state as any).states) {
        max = Math.max(max, this.measureDepth((state as any).states, currentDepth + 1));
      }
    }
    return max;
  }

  trimContext(context: Record<string, any>): Record<string, any> {
    if (!context || !Array.isArray(context.auditLog)) return context;
    if (context.auditLog.length <= CONTEXT_RING_SIZE) return context;
    return { ...context, auditLog: context.auditLog.slice(-CONTEXT_RING_SIZE) };
  }

  async warmActiveMachines(tenantIds: string[]) {
    for (const tenantId of tenantIds) {
      const machines = await (this.prisma as any).wmsStateMachine.findMany({
        where: { tenantId, isActive: true },
        take: 100,
      });
      for (let i = 0; i < machines.length; i += 10) {
        const chunk = machines.slice(i, i + 10);
        await Promise.all(chunk.map((m: any) =>
          this.redis.setex(`${CACHE_PREFIX}${tenantId}:${m.machineKey}`, CACHE_TTL, JSON.stringify(m)),
        ));
      }
    }
  }
}
