import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import * as crypto from 'crypto';

const SESSION_TTL = 12 * 60 * 60;

@Injectable()
export class ScannerAuthService {
  private readonly logger = new Logger(ScannerAuthService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async login(deviceId: string, tenantCode: string, pin: string): Promise<{ scannerToken: string; expiresIn: number }> {
    const apiKey = await this.redis.get(`scanner:pin:${deviceId}`);
    if (!apiKey || apiKey !== pin) {
      throw new UnauthorizedException('Invalid PIN or device not registered');
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.redis.setex(
      `scanner:session:${deviceId}`,
      SESSION_TTL,
      JSON.stringify({ token, deviceId, tenantCode, createdAt: Date.now() }),
    );

    return { scannerToken: token, expiresIn: SESSION_TTL };
  }

  async validateToken(deviceId: string, token: string): Promise<{ deviceId: string; tenantCode: string } | null> {
    const raw = await this.redis.get(`scanner:session:${deviceId}`);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (session.token !== token) return null;

    await this.redis.expire(`scanner:session:${deviceId}`, SESSION_TTL);
    return { deviceId: session.deviceId, tenantCode: session.tenantCode };
  }

  async logout(deviceId: string): Promise<void> {
    await this.redis.del(`scanner:session:${deviceId}`);
  }

  async registerDevice(deviceId: string, pin: string, tenantCode: string): Promise<void> {
    await this.redis.setex(`scanner:pin:${deviceId}`, 7 * 24 * 60 * 60, pin);
    await this.redis.sadd(`scanner:devices:${tenantCode}`, deviceId);
  }
}
