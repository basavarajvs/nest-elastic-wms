import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CountMethodOverrideGuard implements CanActivate {
  private readonly logger = new Logger(CountMethodOverrideGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { countId, newMethod } = request.body;
    const tenantId = request.tenantContext?.getTenantId();
    const userId = request.user?.userId;
    const roles: string[] = request.user?.roles || [];

    if (!countId || !newMethod) return true;

    const isSupervisor = roles.includes('WAREHOUSE_SUPERVISOR') || roles.includes('WAREHOUSE_ADMIN');
    if (!isSupervisor) return false;

    const count = await (this.prisma as any).cycleCount.findFirst({
      where: { id: countId, tenantId },
      include: { lines: { where: { status: { not: 'COUNTED' } } } },
    });
    if (!count) return false;

    await (this.prisma as any).cycleCount.update({
      where: { id: countId },
      data: { countMethod: newMethod },
    });

    this.logger.warn(`Count method changed: ${countId} ${count.countMethod} → ${newMethod} by ${userId}`);
    this.eventEmitter.emit('count.method.changed', { countId, oldMethod: count.countMethod, newMethod, changedBy: userId, tenantId });
    return true;
  }
}
