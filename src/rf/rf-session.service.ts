import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
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

    await this.redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );
    this.logger.log(`RF session started: ${sessionId} (${workflow})`);
    return { sessionId };
  }

  async getSession(sessionId: string): Promise<RfSession | null> {
    const data = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;
    return JSON.parse(data) as RfSession;
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

    await this.redis.setex(
      `${SESSION_PREFIX}${sessionId}`,
      SESSION_TTL,
      JSON.stringify(session),
    );
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
    await this.redis.del(`${SESSION_PREFIX}${sessionId}`);
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
