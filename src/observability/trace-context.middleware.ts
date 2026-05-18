import { Injectable, NestMiddleware } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { propagation, context } from '@opentelemetry/api';
import { traceContextStorage } from './otel.config';

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  use(req: FastifyRequest, _res: FastifyReply, next: () => void) {
    const carrier: Record<string, string> = {};
    const traceParent = req.headers['traceparent'] as string;
    const xRequestId = req.headers['x-request-id'] as string;

    if (traceParent) {
      carrier.traceparent = traceParent;
    }
    if (xRequestId) {
      carrier['x-request-id'] = xRequestId;
    }

    const ctx = propagation.extract(context.active(), carrier);
    const ctxMap = new Map<string, any>();
    ctxMap.set('traceId', xRequestId || traceParent || req.id);
    ctxMap.set('tenantId', (req as any).user?.tenantId || req.headers['x-tenant-id'] || '');

    traceContextStorage.run(ctxMap, () => {
      context.with(ctx, next);
    });
  }
}
