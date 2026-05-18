import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const ENGINE_TIMEOUTS: Record<string, number> = {
  JDM: 10_000,
  XSTATE: 30_000,
  BPMN: 60_000,
};

const MAX_HEAP_PER_REQUEST = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class EngineResourceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const engineType: string | undefined = this.reflector.getAllAndOverride('ENGINE_TYPE', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!engineType) return true;

    const timeout = ENGINE_TIMEOUTS[engineType];
    if (!timeout) return true;

    const heapUsed = process.memoryUsage().heapUsed;
    if (heapUsed > MAX_HEAP_PER_REQUEST) {
      throw new BadRequestException('EngineResourceGuard: heap limit exceeded for request');
    }

    const req = context.switchToHttp().getRequest();
    const controller = new AbortController();
    req.engineTimeout = setTimeout(() => {
      controller.abort();
      req.engineTimedOut = true;
    }, timeout);

    req.engineController = controller;
    req.engineType = engineType;
    req.engineTimeoutMs = timeout;

    return true;
  }
}

export function SetEngineType(engineType: string) {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata('ENGINE_TYPE', engineType, target, propertyKey);
  };
}
