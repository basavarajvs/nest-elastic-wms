import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NestLpnDto, MoveLpnDto } from './dtos/lpn.dto';

// LPN type hierarchy: PALLET(5) > CARTON(4) > CASE(3) > MIXED(2) > EACH(1)
const LPN_TYPE_RANK: Record<string, number> = {
  PALLET: 5,
  CARTON: 4,
  CASE: 3,
  MIXED: 2,
  EACH: 1,
};
const MAX_NESTING_DEPTH = 3;

@Injectable()
export class LpnService {
  private readonly logger = new Logger(LpnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByNumber(lpnNumber: string, tenantId: string): Promise<any> {
    return (this.prisma as any).lPN.findFirst({
      where: { lpnNumber, tenantId },
      include: {
        children: true,
        parent: true,
      },
    });
  }

  async nestLpn(dto: NestLpnDto, tenantId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const child = await tx.lPN.findFirst({
        where: { id: dto.childLpnId, tenantId },
      });
      if (!child) throw new BadRequestException('Child LPN not found');

      const parent = await tx.lPN.findFirst({
        where: { id: dto.parentLpnId, tenantId },
      });
      if (!parent) throw new BadRequestException('Parent LPN not found');

      // Status validation
      const validParentStatuses = ['RECEIVED', 'IN_STAGING'];
      if (!validParentStatuses.includes(parent.status)) {
        throw new BadRequestException(`Parent LPN status ${parent.status} does not allow nesting`);
      }

      // Type hierarchy: parent must be >= child in rank
      const parentRank = LPN_TYPE_RANK[parent.lpnType] || 0;
      const childRank = LPN_TYPE_RANK[child.lpnType] || 0;
      if (parentRank < childRank) {
        throw new BadRequestException(
          `Cannot nest ${child.lpnType} into ${parent.lpnType}. Scan a valid parent container.`,
        );
      }

      // Circular reference check + depth validation via recursive CTE
      const cycleCheck: any[] = await tx.$queryRawUnsafe(`
        WITH RECURSIVE lpn_tree AS (
          SELECT id, parent_lpn_id, 1 AS depth
          FROM multitenant.license_plate_numbers
          WHERE id = $1::uuid
          UNION ALL
          SELECT lp.id, lp.parent_lpn_id, lt.depth + 1
          FROM multitenant.license_plate_numbers lp
          JOIN lpn_tree lt ON lt.parent_lpn_id = lp.id
          WHERE lt.depth <= ${MAX_NESTING_DEPTH}
        )
        SELECT * FROM lpn_tree
      `, dto.childLpnId);

      const wouldCycle = cycleCheck.some((n: any) => n.id === dto.parentLpnId);
      if (wouldCycle) {
        throw new BadRequestException('Nesting would create a circular reference');
      }

      const maxDepth = Math.max(...cycleCheck.map((n: any) => n.depth), 0);
      if (maxDepth >= MAX_NESTING_DEPTH) {
        throw new BadRequestException(`Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`);
      }

      return tx.lPN.update({
        where: { id: dto.childLpnId },
        data: {
          parentLpnId: dto.parentLpnId,
          status: 'NESTED',
          locationId: parent.locationId,
        },
      });
    });
  }

  async moveLpn(lpnId: string, dto: MoveLpnDto, tenantId: string): Promise<any> {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { id: lpnId, tenantId },
    });
    if (!lpn) throw new BadRequestException('LPN not found');

    const result = await (this.prisma as any).lPN.update({
      where: { id: lpnId },
      data: { locationId: dto.locationId },
    });
    this.eventEmitter.emit('lpn.moved', { lpnId, from: lpn.locationId, to: dto.locationId, tenantId });
    return result;
  }

  async auditLpn(lpnId: string, transactionType: string, tenantId: string): Promise<void> {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { id: lpnId, tenantId },
    });
    if (!lpn) return;
    this.logger.log(`LPN Audit: ${lpn.lpnNumber} type=${transactionType}`);
  }
}
