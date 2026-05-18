import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const REVOCATION_PREFIX = 'jwt:revocation:';
const ROTATION_WINDOW_HOURS = 12;

@Injectable()
export class JwtValidationService {
  private readonly logger = new Logger(JwtValidationService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateToken(token: string): Promise<{ valid: boolean; useOld: boolean }> {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, useOld: false };

    const payload = this.decodePayload(parts[1]);
    if (!payload || !payload.iat || !payload.jti) return { valid: false, useOld: false };

    const revoked = await this.isRevoked(payload.jti);
    if (revoked) {
      this.eventEmitter.emit('jwt.rotation.attack_detected', {
        jti: payload.jti,
        iat: payload.iat,
        reason: 'token_revoked',
        timestamp: new Date().toISOString(),
      });
      return { valid: false, useOld: false };
    }

    const rotationTimestamp = await this.getRotationTimestamp();
    if (!rotationTimestamp) return { valid: true, useOld: false };

    const tokenIssuedMs = payload.iat * 1000;
    const rotationMs = parseInt(rotationTimestamp, 10);

    if (tokenIssuedMs < rotationMs) {
      const ageHours = (Date.now() - tokenIssuedMs) / 3600000;
      if (ageHours > ROTATION_WINDOW_HOURS) {
        this.logger.warn(`Token ${payload.jti} issued before rotation, age=${ageHours.toFixed(1)}h — marking revoked`);
        await this.markRevoked(payload.jti, 'pre_rotation_expired');
        this.eventEmitter.emit('jwt.rotation.attack_detected', {
          jti: payload.jti,
          iat: payload.iat,
          reason: 'token_before_rotation_past_window',
          ageHours,
        });
        return { valid: false, useOld: false };
      }

      return { valid: true, useOld: true };
    }

    return { valid: true, useOld: false };
  }

  async recordRotation(newSecretTimestamp: string): Promise<void> {
    await this.redis.set('jwt:last_rotation', newSecretTimestamp);
    await this.redis.publish(
      'wms:jwt:rotation',
      JSON.stringify({ timestamp: newSecretTimestamp }),
    );
    this.logger.log(`JWT rotation recorded at ${newSecretTimestamp}`);
  }

  private async getRotationTimestamp(): Promise<string | null> {
    return this.redis.get('jwt:last_rotation');
  }

  private async isRevoked(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(`${REVOCATION_PREFIX}${jti}`);
    return exists === 1;
  }

  async markRevoked(jti: string, reason: string): Promise<void> {
    await this.redis.set(
      `${REVOCATION_PREFIX}${jti}`,
      JSON.stringify({ reason, revokedAt: new Date().toISOString() }),
      'PX',
      ROTATION_WINDOW_HOURS * 3600 * 1000,
    );
  }

  async clearRevoked(): Promise<void> {
    const keys = await this.redis.keys(`${REVOCATION_PREFIX}*`);
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl <= 0) await this.redis.del(key);
    }
  }

  private decodePayload(base64: string): Record<string, any> | null {
    try {
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
