import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AllocationOverrideGuard implements CanActivate {
  private readonly logger = new Logger(AllocationOverrideGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { allocationId, substituteLotId, reason } = request.body;
    const tenantId = request.tenantContext?.getTenantId();
    const userId = request.user?.userId;
    const roles: string[] = request.user?.roles || [];

    if (!allocationId) return true;

    const isSupervisor = roles.includes('WAREHOUSE_SUPERVISOR') || roles.includes('WAREHOUSE_ADMIN');
    if (!isSupervisor) {
      this.logger.warn(`Non-supervisor user ${userId} attempted allocation override`);
      return false;
    }

    if (!reason || reason.trim().length === 0) {
      return false;
    }

    this.eventEmitter.emit('allocation.override', {
      allocationId,
      substituteLotId,
      reason,
      overriddenBy: userId,
      timestamp: new Date(),
      tenantId,
    });

    this.logger.log(`Allocation override: ${allocationId} → lot ${substituteLotId} by ${userId}: ${reason}`);
    return true;
  }
}
