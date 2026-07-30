import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { SupervisorPinService } from '../../security/supervisor-pin.service';
import { HoldReleasedEvent } from '../../events/definitions/quality.events';

@Injectable()
export class HoldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly supervisorPinService: SupervisorPinService,
  ) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.inventory_holds.findFirst({
      where: { tenant_id: tenantId, hold_id: id },
    });
    await this.prisma.inventory_holds.deleteMany({
      where: { tenant_id: tenantId, hold_id: id },
    });
    if (!entity) return null;
    const mapped = await this.mapHolds(tenantId, [entity]);
    return mapped[0];
  }

  async create(tenantId: string, dto: any) {
    const { facility_id, lpn_id, inventory_item_id, ...rest } = dto;
    const created = await this.prisma.inventory_holds.create({
      data: {
        tenant_id: tenantId,
        facility_id: facility_id ? BigInt(facility_id) : undefined,
        lpn_id: lpn_id ? BigInt(lpn_id) : undefined,
        inventory_item_id: inventory_item_id ? BigInt(inventory_item_id) : undefined,
        ...rest,
      },
    });
    const mapped = await this.mapHolds(tenantId, [created]);
    return mapped[0];
  }

  async findAll(tenantId: string, query: any) {
    const { productId, locationId, status, holdReason, facilityId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (productId) where.product_id = BigInt(productId);
    if (locationId) where.location_id = BigInt(locationId);
    if (status) where.status = status;
    if (holdReason) where.hold_reason = holdReason;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_holds.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_holds.count({ where }),
    ]);
    return { data: await this.mapHolds(tenantId, data), total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const hold = await this.prisma.inventory_holds.findFirst({
      where: { tenant_id: tenantId, hold_id: BigInt(id) },
    });
    if (!hold) throw new NotFoundException('Hold not found');
    const mapped = await this.mapHolds(tenantId, [hold]);
    return mapped[0];
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facility_id, ...rest } = dto;
    const updated = await this.prisma.inventory_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...rest,
      },
    });
    const mapped = await this.mapHolds(tenantId, [updated]);
    return mapped[0];
  }

  async release(tenantId: string, id: string, userId: string, reason?: string, supervisorPin?: string) {
    const hold = await this.findById(tenantId, id);
    if (hold.status !== 'ACTIVE') throw new ForbiddenException('Hold is not active');

    if (supervisorPin) {
      const verification = await this.supervisorPinService.verifyPin(tenantId, userId, supervisorPin);
      if (!verification.valid) {
        throw new ForbiddenException('Invalid supervisor PIN: ' + (verification as any).reason);
      }
    }

    const updated = await this.prisma.inventory_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        status: 'RELEASED',
        released_by_user_id: userId,
        released_at: new Date(),
        release_notes: reason || null,
      },
    });

    this.eventEmitter.emit(
      'hold.released',
      new HoldReleasedEvent({
        tenant_id: tenantId,
        facility_id: hold.facility_id,
        hold_id: hold.hold_id,
        product_id: hold.product_id || undefined,
        released_by: userId,
        reason: reason,
      }),
    );

    const mapped = await this.mapHolds(tenantId, [updated]);
    return mapped[0];
  }

  async findByLpnId(tenantId: string, lpnId: string) {
    const data = await this.prisma.inventory_holds.findMany({
      where: { tenant_id: tenantId, lpn_id: BigInt(lpnId), status: 'ACTIVE' },
    });
    return this.mapHolds(tenantId, data);
  }

  private async mapHolds(tenantId: string, data: any[]) {
    const facilityIds = [...new Set(data.map(d => d.facility_id).filter(Boolean))];
    const facilities = facilityIds.length
      ? await this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } })
      : [];
    const facilityMap = new Map(facilities.map(f => [f.facility_id, f.facility_name]));
    return data.map(d => ({ ...d, facility_name: facilityMap.get(d.facility_id) }));
  }
}
