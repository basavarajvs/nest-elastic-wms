import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const modules: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      modules.database = 'connected';
    } catch {
      modules.database = 'disconnected';
    }

    try {
      await this.redis.ping();
      modules.redis = 'connected';
    } catch {
      modules.redis = 'disconnected';
    }

    const allConnected = Object.values(modules).every((v) => v === 'connected');
    return {
      status: allConnected ? 'ok' : 'degraded',
      modules,
      timestamp: new Date().toISOString(),
    };
  }
}
