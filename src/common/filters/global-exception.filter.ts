import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: any = {
      statusCode: status,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        body = { statusCode: status, error: 'ERROR', message: response };
      } else {
        body = response;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    reply.status(status).send(body);
  }
}
