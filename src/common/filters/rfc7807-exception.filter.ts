import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Prisma } from '../../../generated/prisma';
import { QuotaExceededException } from '../exceptions/quota-exceeded.exception';

const PRISMA_STATUS_MAP: Record<string, { status: number; title: string }> = {
  P2025: { status: 404, title: 'Not Found' },
  P2002: { status: 409, title: 'Conflict' },
  P2003: { status: 422, title: 'Unprocessable Entity' },
  P2014: { status: 400, title: 'Bad Request' },
  P2021: { status: 500, title: 'Internal Server Error' },
};

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(Rfc7807ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<any>();
    const traceId = req?.headers?.['x-request-id'] || req?.id || '';
    const tenantId = req?.tenantContext?.getTenantId?.() || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let problem: Record<string, any> = {
      type: 'https://wms.internal/problems/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      traceId,
      tenantId,
    };

    if (exception instanceof QuotaExceededException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      problem = {
        type: 'https://wms.internal/problems/quota-exceeded',
        title: 'Quota Exceeded',
        status: 429,
        detail: exception.message,
        resourceType: (exception as any).resourceType,
        limit: (exception as any).limit,
        current: (exception as any).current,
        retryAfter: '30d',
        traceId,
        tenantId,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      const respBody = typeof response === 'string' ? { message: response } : response;

      problem = {
        type: `https://wms.internal/problems/${status}`,
        title: this.getTitleForStatus(status),
        status,
        detail: (respBody as any).message || (respBody as any).error || 'Request failed',
        errors: (respBody as any).details || (respBody as any).errors,
        traceId,
        tenantId,
      };

      if ((exception as any).cause?.retryAfterMs) {
        problem.retryAfterMs = (exception as any).cause.retryAfterMs;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapping = PRISMA_STATUS_MAP[exception.code];
      status = mapping?.status || 422;
      problem = {
        type: `https://wms.internal/problems/${exception.code.toLowerCase()}`,
        title: mapping?.title || 'Database Error',
        status,
        detail: exception.message,
        code: exception.code,
        meta: (exception as any).meta,
        traceId,
        tenantId,
      };
    } else if (exception instanceof Error) {
      const isProd = process.env.NODE_ENV === 'production';
      problem = {
        type: 'https://wms.internal/problems/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: isProd ? 'An unexpected error occurred' : exception.message,
        traceId,
        tenantId,
      };
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    reply.status(status).headers({
      'Content-Type': 'application/problem+json',
      ...(problem.retryAfterMs ? { 'Retry-After': String(Math.ceil(problem.retryAfterMs / 1000)) } : {}),
    }).send(problem);
  }

  private getTitleForStatus(status: number): string {
    const titles: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      402: 'Payment Required',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      503: 'Service Unavailable',
    };
    return titles[status] || 'Error';
  }
}
