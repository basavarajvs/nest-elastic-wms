import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

const RF_UNREAD_PREFIX = 'wms:rf:unread:';
const MAX_PER_SESSION = 50;

@ApiTags('WMS-RF')
@Controller('rf/notifications')
export class NotificationRfController {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Post('poll')
  @HttpCode(HttpStatus.OK)
  async poll(
    @Body() dto: { userId: string; sessionId: string },
    @Headers('if-none-match') ifNoneMatch?: string,
  ) {
    const key = `${RF_UNREAD_PREFIX}${dto.userId}:${dto.sessionId}`;
    const raw = await this.redis.lrange(key, 0, MAX_PER_SESSION - 1);

    if (!raw || raw.length === 0) {
      return { notifications: [] };
    }

    const hash = crypto.createHash('md5').update(raw.join('|')).digest('hex');
    const etag = `"${hash}"`;

    if (ifNoneMatch === etag) {
      return { notifications: [] };
    }

    const notifications = raw.map((r) => JSON.parse(r));

    await this.redis.del(key);

    return {
      notifications,
      etag,
    };
  }
}
