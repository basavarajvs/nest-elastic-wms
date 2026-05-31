import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLpnDto } from './dtos/create-lpn.dto';
import { UpdateLpnDto } from './dtos/update-lpn.dto';
import { LpnFilterDto } from './dtos/lpn-filter.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

const LPN_TYPE_RANK: Record<string, number> = {
  PALLET: 5, CARTON: 4, CASE: 3, MIXED: 2, EACH: 1,
};
const MAX_NESTING_DEPTH = 3;

@Injectable()
export class LpnService {
  private readonly logger = new Logger(LpnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLpnDto, tenantId: string) {
    const existing = await (this.prisma as any).lPN.findFirst({
      where: { tenantId, lpnNumber: dto.lpnNumber },
    });
    if (existing) {
      throw new BadRequestException(`LPN ${dto.lpnNumber} already exists`);
    }

    const lpn = await (this.prisma as any).lPN.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        lpnNumber: dto.lpnNumber,
        lpnType: dto.lpnType || 'PALLET',
        locationId: dto.locationId,
        productId: dto.productId || null,
        lotNumber: dto.lotNumber || null,
        quantity: dto.quantity ?? 0,
        uomId: dto.uomId,
      },
    });

    this.logger.log(`LPN created: ${dto.lpnNumber}`);
    return lpn;
  }

  async findById(id: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { id, tenantId },
      include: {
        children: { select: { id: true, lpnNumber: true, lpnType: true, quantity: true, status: true } },
        parent: { select: { id: true, lpnNumber: true } },
      },
    });
    if (!lpn) throw new NotFoundException('LPN not found');
    return lpn;
  }

  async findByNumber(lpnNumber: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { lpnNumber, tenantId },
      include: {
        children: { select: { id: true, lpnNumber: true, lpnType: true, quantity: true, status: true } },
        parent: { select: { id: true, lpnNumber: true } },
      },
    });
    if (!lpn) throw new NotFoundException('LPN not found');
    return lpn;
  }

  async findByLocation(locationId: string, tenantId: string) {
    return (this.prisma as any).lPN.findMany({
      where: { locationId, tenantId },
      include: {
        children: { select: { id: true, lpnNumber: true, lpnType: true, quantity: true } },
      },
    });
  }

  async findAvailable(facilityId: string, tenantId: string) {
    return (this.prisma as any).lPN.findMany({
      where: {
        tenantId,
        facilityId,
        status: { in: ['STORED', 'PUTAWAY_PENDING'] },
        parentLpnId: null,
      },
      include: {
        children: { select: { id: true, lpnNumber: true, quantity: true } },
      },
    });
  }

  async findAvailableForShipment(facilityId: string, tenantId: string) {
    return (this.prisma as any).lPN.findMany({
      where: {
        tenantId,
        facilityId,
        status: 'STORED',
        parentLpnId: null,
        quantity: { gt: 0 },
      },
      include: {
        children: { select: { id: true, lpnNumber: true, quantity: true } },
      },
    });
  }

  async findProductAvailableQuantity(productId: string, facilityId: string, tenantId: string) {
    const result = await (this.prisma as any).lPN.aggregate({
      where: {
        tenantId,
        facilityId,
        productId,
        status: 'STORED',
        parentLpnId: null,
      },
      _sum: { quantity: true },
    });
    return { productId, availableQuantity: result._sum.quantity || 0 };
  }

  async list(tenantId: string, filter: LpnFilterDto) {
    const where: Record<string, any> = { tenantId };
    if (filter.facilityId) where.facilityId = filter.facilityId;
    if (filter.locationId) where.locationId = filter.locationId;
    if (filter.productId) where.productId = filter.productId;
    if (filter.status) where.status = filter.status;
    if (filter.statusIn) where.status = { in: filter.statusIn };

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 50, 200);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (this.prisma as any).lPN.findMany({
        where,
        skip,
        take: limit,
        include: {
          children: { select: { id: true, lpnNumber: true, lpnType: true } },
          parent: { select: { id: true, lpnNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).lPN.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, tenantId: string, dto: UpdateLpnDto) {
    const lpn = await (this.prisma as any).lPN.findFirst({ where: { id, tenantId } });
    if (!lpn) throw new NotFoundException('LPN not found');

    const updated = await (this.prisma as any).lPN.update({
      where: { id },
      data: {
        locationId: dto.locationId,
        productId: dto.productId,
        lotNumber: dto.lotNumber,
        quantity: dto.quantity,
        status: dto.status,
      },
    });

    if (dto.status) {
      this.eventEmitter.emit('lpn.status_changed', {
        lpnId: id,
        lpnNumber: lpn.lpnNumber,
        from: lpn.status,
        to: dto.status,
        tenantId,
      });
    }

    return updated;
  }

  async nestLpn(childLpnId: string, parentLpnId: string, tenantId: string) {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const child = await tx.lPN.findFirst({ where: { id: childLpnId, tenantId } });
      if (!child) throw new BadRequestException('Child LPN not found');

      const parent = await tx.lPN.findFirst({ where: { id: parentLpnId, tenantId } });
      if (!parent) throw new BadRequestException('Parent LPN not found');

      const validParentStatuses = ['RECEIVED', 'IN_STAGING', 'STORED'];
      if (!validParentStatuses.includes(parent.status)) {
        throw new BadRequestException(`Parent LPN status ${parent.status} does not allow nesting`);
      }

      const parentRank = LPN_TYPE_RANK[parent.lpnType] || 0;
      const childRank = LPN_TYPE_RANK[child.lpnType] || 0;
      if (parentRank < childRank) {
        throw new BadRequestException(
          `Cannot nest ${child.lpnType} into ${parent.lpnType}. Scan a valid parent container.`,
        );
      }

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
      `, childLpnId);

      if (cycleCheck.some((n: any) => n.id === parentLpnId)) {
        throw new BadRequestException('Nesting would create a circular reference');
      }

      const maxDepth = Math.max(...cycleCheck.map((n: any) => n.depth), 0);
      if (maxDepth >= MAX_NESTING_DEPTH) {
        throw new BadRequestException(`Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`);
      }

      return tx.lPN.update({
        where: { id: childLpnId },
        data: { parentLpnId, status: 'NESTED', locationId: parent.locationId },
      });
    });
  }

  async unnestLpn(lpnId: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({ where: { id: lpnId, tenantId } });
    if (!lpn) throw new BadRequestException('LPN not found');
    if (lpn.status !== 'NESTED') {
      throw new BadRequestException('LPN is not nested');
    }

    const updated = await (this.prisma as any).lPN.update({
      where: { id: lpnId },
      data: { parentLpnId: null, status: 'STORED' },
    });

    this.eventEmitter.emit('lpn.unnested', { lpnId, lpnNumber: lpn.lpnNumber, tenantId });
    return updated;
  }

  async moveLpn(lpnId: string, locationId: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({ where: { id: lpnId, tenantId } });
    if (!lpn) throw new BadRequestException('LPN not found');

    const updated = await (this.prisma as any).lPN.update({
      where: { id: lpnId },
      data: { locationId },
    });

    this.eventEmitter.emit('lpn.moved', {
      lpnId, lpnNumber: lpn.lpnNumber,
      from: lpn.locationId, to: locationId, tenantId,
    });
    return updated;
  }

  async getChildren(lpnId: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({ where: { id: lpnId, tenantId } });
    if (!lpn) throw new NotFoundException('LPN not found');

    const children = await (this.prisma as any).lPN.findMany({
      where: { parentLpnId: lpnId, tenantId },
    });

    const result: any[] = [];
    for (const child of children) {
      const grandchildren = await this.getChildren(child.id, tenantId);
      result.push({ ...child, children: grandchildren });
    }
    return result;
  }

  async findByGrnLine(grnLineId: string, tenantId: string) {
    return (this.prisma as any).lPN.findMany({
      where: { grnLineId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHierarchy(lpnId: string, tenantId: string) {
    const lpn = await this.findById(lpnId, tenantId);
    const children = await this.getChildren(lpnId, tenantId);
    return { ...lpn, children };
  }

  async delete(id: string, tenantId: string) {
    const lpn = await (this.prisma as any).lPN.findFirst({ where: { id, tenantId } });
    if (!lpn) throw new NotFoundException('LPN not found');

    const childrenCount = await (this.prisma as any).lPN.count({
      where: { parentLpnId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete LPN with nested children. Unnest first.');
    }

    await (this.prisma as any).lPN.delete({ where: { id } });
    this.logger.log(`LPN deleted: ${lpn.lpnNumber}`);
  }
}
