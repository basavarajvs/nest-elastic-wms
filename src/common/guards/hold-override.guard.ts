import { Injectable, CanActivate, ExecutionContext, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export const HOLD_OVERRIDE_KEY = 'hold_override';
export const HoldOverride = () => SetMetadata(HOLD_OVERRIDE_KEY, true);

@Injectable()
export class HoldOverrideGuard implements CanActivate {
  private readonly logger = new Logger(HoldOverrideGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresOverride = this.reflector.getAllAndOverride<boolean>(HOLD_OVERRIDE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresOverride) return true;

    const request = context.switchToHttp().getRequest();
    const { lotId, overrideReason } = request.body;
    const tenantId = request.tenantContext?.getTenantId();
    const userId = request.user?.userId;
    const roles: string[] = request.user?.roles || [];

    const isSupervisor = roles.includes('WAREHOUSE_SUPERVISOR') || roles.includes('WAREHOUSE_ADMIN');
    if (!isSupervisor) {
      this.logger.warn(`Non-supervisor user ${userId} attempted hold override without authorization`);
      return false;
    }

    if (!overrideReason || overrideReason.trim().length === 0) {
      return false;
    }

    if (lotId) {
      const activeHolds = await (this.prisma as any).inventoryHold.findMany({
        where: { tenantId, lotId, status: 'ACTIVE' },
      });

      if (activeHolds.length > 0) {
        this.eventEmitter.emit('hold.bypass.override', {
          lotId,
          holdIds: activeHolds.map((h: any) => h.id),
          reason: overrideReason,
          overriddenBy: userId,
          tenantId,
          timestamp: new Date(),
        });

        this.logger.warn(`Hold override: lot ${lotId} by user ${userId}: ${overrideReason}`);
      }
    }

    return true;
  }
}
