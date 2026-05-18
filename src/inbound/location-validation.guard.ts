import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

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
    const userId = request.user?.userId;
    const roles: string[] = request.user?.roles || [];

    if (!taskId || !scannedLocationId) return true;

    const task = await (this.prisma as any).putawayTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task || !task.suggestedLocationId) return true;

    if (task.suggestedLocationId === scannedLocationId) return true;

    if (supervisorPinOverride) {
      const isSupervisor = roles.includes('WAREHOUSE_SUPERVISOR') || roles.includes('WAREHOUSE_ADMIN');
      if (!isSupervisor) {
        this.logger.warn(`Non-supervisor user ${userId} attempted location override without authorization`);
        request.response = { error: 'Only supervisors can override location assignments.' };
        return false;
      }

      if (supervisorPinOverride.length < 4) {
        this.logger.warn(`Invalid supervisor PIN format from user ${userId}`);
        request.response = { error: 'Invalid supervisor override PIN format.' };
        return false;
      }

      const supervisorPinHash = crypto.createHash('sha256').update(supervisorPinOverride).digest('hex');
      const validPin = await (this.prisma as any).supervisorPin.findFirst({
        where: { userId, tenantId, pinHash: supervisorPinHash, isActive: true },
      });
      if (!validPin) {
        this.logger.warn(`Invalid supervisor PIN attempt from user ${userId} for task ${taskId}`);
        request.response = { error: 'Invalid supervisor override PIN.' };
        return false;
      }

      this.eventEmitter.emit('putaway.location.override', {
        taskId,
        suggestedLocationId: task.suggestedLocationId,
        scannedLocationId,
        scannedLocationCode,
        overriddenBy: userId,
        timestamp: new Date(),
        tenantId,
      });
      this.logger.warn(`Putaway location override: task=${taskId} suggested=${task.suggestedLocationId} actual=${scannedLocationId} by=${userId}`);
      return true;
    }

    request.response = { error: 'Location mismatch. Scan suggested location or enter supervisor override PIN.', suggestedLocationCode: task.suggestedLocationId };
    return false;
  }
}
