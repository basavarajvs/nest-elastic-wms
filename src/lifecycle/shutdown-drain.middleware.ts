import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ShutdownService } from './shutdown.service';

@Injectable()
export class ShutdownDrainMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ShutdownDrainMiddleware.name);

  constructor(private readonly shutdownService: ShutdownService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    if (this.shutdownService.shuttingDown) {
      const isRf = req.url?.startsWith('/rf/');
      if (!isRf) {
        throw new ServiceUnavailableException(
          'Server is shutting down. Please retry shortly.',
        );
      }
    }
    next();
  }
}
