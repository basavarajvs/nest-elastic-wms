import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface RfSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  workflowId: string;
  workflow: string;
  payload: Record<string, any>;
  state: Record<string, any>;
  createdAt: number;
  lastActivityAt: number;
}

const SESSION_TTL = 15 * 60; // 15 minutes
const SESSION_PREFIX = 'wms:rf:session:';

@Injectable()
export class RfSessionService {
  private readonly logger = new Logger(RfSessionService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async start(
    tenantId: string,
    userId: string,
    workflow: string,
    payload: Record<string, any>,
  ): Promise<{ sessionId: string }> {
    const sessionId = uuidv4();
    const session: RfSession = {
      sessionId,
      tenantId,
      userId,
      workflowId: `${tenantId}:${userId}:${workflow}`,
      workflow,
      payload,
      state: { status: 'started', step: 0 },
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    await Promise.all([
      this.redis.setex(
        `${SESSION_PREFIX}${sessionId}`,
        SESSION_TTL,
        JSON.stringify(session),
      ),
      (this.prisma as any).dbRfSession.create({
        data: {
          id: sessionId,
          tenantId,
          userId,
          workflowId: session.workflowId,
          workflow,
          payload,
          state: session.state,
          status: 'started',
        },
      }),
    ]);
    this.logger.log(`RF session started: ${sessionId} (${workflow})`);
    return { sessionId };
  }

  async getSession(sessionId: string): Promise<RfSession | null> {
    const data = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (data) return JSON.parse(data) as RfSession;

    // Redis GC or restart — try DB fallback
    const dbSession = await (this.prisma as any).dbRfSession.findFirst({
      where: { id: sessionId, status: { not: 'completed' } },
    });
    if (!dbSession) return null;

    const recovered: RfSession = {
      sessionId: dbSession.id,
      tenantId: dbSession.tenantId,
      userId: dbSession.userId,
      workflowId: dbSession.workflowId,
      workflow: dbSession.workflow,
      payload: dbSession.payload as Record<string, any>,
      state: { ...(dbSession.state as Record<string, any>), recovered: true },
      createdAt: new Date(dbSession.createdAt).getTime(),
      lastActivityAt: Date.now(),
    };

    // Restore to Redis
    await this.redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(recovered),
    );

    const stateData = dbSession.state as Record<string, any> || {};
    const hadTask = !!(stateData.assignedTask || stateData.taskId);
    const lastActivity = dbSession.updatedAt || dbSession.createdAt;
    const idleMinutes = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 60000);

    if (hadTask && idleMinutes >= SESSION_TTL / 60) {
      this.eventEmitter.emit('rf.session.timeout', {
        sessionId: dbSession.id,
        userId: dbSession.userId,
        workflow: dbSession.workflow,
        idleMinutes,
        hadTask: true,
        tenantId: dbSession.tenantId,
      });
    }

    this.logger.warn(`RF session recovered from DB: ${sessionId}`);
    return recovered;
  }

  async advanceStep(
    sessionId: string,
    stepData: Record<string, any>,
  ): Promise<RfSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.state.step++;
    session.state = { ...session.state, ...stepData, status: 'in_progress' };
    session.lastActivityAt = Date.now();

    await Promise.all([
      this.redis.setex(
        `${SESSION_PREFIX}${sessionId}`,
        SESSION_TTL,
        JSON.stringify(session),
      ),
      (this.prisma as any).dbRfSession.update({
        where: { id: sessionId },
        data: { state: session.state, status: 'in_progress' },
      }),
    ]);
    return session;
  }

  async resume(sessionId: string): Promise<RfSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.lastActivityAt = Date.now();
    await this.redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );
    return session;
  }

  async complete(sessionId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`${SESSION_PREFIX}${sessionId}`),
      (this.prisma as any).dbRfSession.update({
        where: { id: sessionId },
        data: { status: 'completed', completedAt: new Date() },
      }).catch(() => {}),
    ]);
    this.logger.log(`RF session completed: ${sessionId}`);
  }

  async extend(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    session.lastActivityAt = Date.now();
    await this.redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );
    return true;
  }
}
