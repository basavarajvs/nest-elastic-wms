import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LocationValidationGuard implements CanActivate {
  private readonly logger = new Logger(LocationValidationGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { taskId, scannedLocationCode, scannedLocationId, supervisorPinOverride } = request.body;
    const tenantId = request.tenantContext?.getTenantId();

    if (!taskId || !scannedLocationId) return true;

    const task = await (this.prisma as any).putawayTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task || !task.suggestedLocationId) return true;

    if (task.suggestedLocationId === scannedLocationId) return true;

    if (supervisorPinOverride) {
      this.eventEmitter.emit('putaway.location.override', {
        taskId,
        suggestedLocationId: task.suggestedLocationId,
        scannedLocationId,
        scannedLocationCode,
        overriddenBy: request.user?.userId,
        timestamp: new Date(),
        tenantId,
      });
      this.logger.warn(`Putaway location override: task=${taskId} suggested=${task.suggestedLocationId} actual=${scannedLocationId} by=${request.user?.userId}`);
      return true;
    }

    request.response = { error: 'Location mismatch. Scan suggested location or enter supervisor override PIN.', suggestedLocationCode: task.suggestedLocationId };
    return false;
  }
}
