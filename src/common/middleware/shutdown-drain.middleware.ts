import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ShutdownService } from '../../lifecycle/shutdown.service';

@Injectable()
export class ShutdownDrainMiddleware implements NestMiddleware {
  constructor(private readonly shutdownService: ShutdownService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    if (!this.shutdownService.isDrainMode()) return next();

    const url: string = req?.url || '';

    if (this.shutdownService.isRfRequest(url)) {
      return next();
    }

    throw new HttpException(
      {
        type: 'https://wms.internal/problems/shutting-down',
        title: 'Service Unavailable',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        detail: 'Server is shutting down. RF endpoints remain active.',
        retryAfterMs: 10000,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
