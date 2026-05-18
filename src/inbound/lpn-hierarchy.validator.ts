import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LPN_TYPE_RANK: Record<string, number> = {
  PALLET: 5,
  CARTON: 4,
  CASE: 3,
  MIXED: 2,
  EACH: 1,
};
const MAX_DEPTH = 3;

@Injectable()
export class LpnHierarchyValidator {
  private readonly logger = new Logger(LpnHierarchyValidator.name);

  constructor(private readonly prisma: PrismaService) {}

  async validate(parentLpnId: string, childLpnId: string, tenantId: string): Promise<void> {
    const [parent, child] = await Promise.all([
      (this.prisma as any).lPN.findFirst({ where: { id: parentLpnId, tenantId } }),
      (this.prisma as any).lPN.findFirst({ where: { id: childLpnId, tenantId } }),
    ]);
    if (!parent) throw new Error('Parent LPN not found');
    if (!child) throw new Error('Child LPN not found');

    const parentRank = LPN_TYPE_RANK[parent.lpnType] || 0;
    const childRank = LPN_TYPE_RANK[child.lpnType] || 0;
    if (parentRank < childRank) {
      throw new Error(`Cannot nest ${child.lpnType} into ${parent.lpnType}. Scan a valid parent container.`);
    }

    const cycleCheck: any[] = await (this.prisma as any).$queryRawUnsafe(`
      WITH RECURSIVE lpn_tree AS (
        SELECT id, parent_lpn_id, 1 AS depth
        FROM multitenant.license_plate_numbers
        WHERE id = $1::uuid
        UNION ALL
        SELECT lp.id, lp.parent_lpn_id, lt.depth + 1
        FROM multitenant.license_plate_numbers lp
        JOIN lpn_tree lt ON lt.parent_lpn_id = lp.id
        WHERE lt.depth <= ${MAX_DEPTH}
      )
      SELECT * FROM lpn_tree
    `, childLpnId);

    if (cycleCheck.some((n: any) => n.id === parentLpnId)) {
      throw new Error('Circular reference detected in LPN hierarchy');
    }

    const maxDepth = Math.max(...cycleCheck.map((n: any) => n.depth), 0);
    if (maxDepth >= MAX_DEPTH) {
      throw new Error(`Maximum nesting depth (${MAX_DEPTH}) exceeded`);
    }
  }
}
