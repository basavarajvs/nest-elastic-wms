import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StateMachineAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StateMachineAuditInterceptor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((result: any) => {
        if (result?.state || result?.instanceId) {
          this.eventEmitter.emit('wms.audit.statemachine', {
            method: req.method,
            path: req.url,
            instanceId: result.instanceId,
            state: result.state,
            duration: Date.now() - startTime,
            tenantId: req.tenantContext?.getTenantId(),
            timestamp: new Date(),
          });
        }
      }),
    );
  }
}
