import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { QualityHoldCreatedEvent, HoldReleasedEvent } from '../../events/definitions/quality.events';

@Injectable()
export class QualityHoldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, dto: any) {
    const hold = await this.prisma.quality_holds.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        hold_number: dto.hold_number,
        hold_name: dto.hold_name,
        description: dto.description,
        reference_type: dto.reference_type,
        reference_id: BigInt(dto.reference_id || 0),
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        lot_id: dto.lot_id ? BigInt(dto.lot_id) : undefined,
        location_id: dto.location_id ? BigInt(dto.location_id) : undefined,
        hold_reason: dto.hold_reason,
        hold_reason_code: dto.hold_reason_code,
        placed_by_user_id: dto.placed_by_user_id,
        affected_quantity: dto.affected_quantity ? dto.affected_quantity : undefined,
        uom_id: dto.uom_id ? BigInt(dto.uom_id) : undefined,
        notes: dto.notes,
        created_by: dto.created_by,
        status: 'OPEN',
      },
    });
    let product_name: string | undefined;
    if (hold.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: hold.product_id } });
      product_name = product?.product_name;
    }

    this.eventEmitter.emit(
      'hold.created',
      new QualityHoldCreatedEvent({
        tenant_id: tenantId,
        facility_id: hold.facility_id,
        hold_id: hold.hold_id,
        product_id: hold.product_id || undefined,
        location_id: hold.location_id || undefined,
        reason: hold.hold_reason,
        created_by: hold.placed_by_user_id || dto.created_by || '',
      }),
    );

    return { ...hold, product_name };
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, holdReason, productId, referenceType, page: queryPage, limit: queryLimit } = query;
    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (status) where.status = status;
    if (holdReason) where.hold_reason = holdReason;
    if (productId) where.product_id = BigInt(productId);
    if (referenceType) where.reference_type = referenceType;
    const [data, total] = await Promise.all([
      this.prisma.quality_holds.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placed_at: 'desc' },
      }),
      this.prisma.quality_holds.count({ where }),
    ]);
    const productIds = [...new Set(data.filter(d => d.product_id).map(d => d.product_id))] as bigint[];
    const products = productIds.length
      ? await this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map(p => [p.product_id, p.product_name]));
    const mapped = data.map(d => ({
      ...d,
      product_name: d.product_id ? productMap.get(d.product_id) : undefined,
    }));
    return { data: mapped, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const hold = await this.prisma.quality_holds.findUnique({
      where: { hold_id: BigInt(id) },
    });
    if (!hold) throw new NotFoundException('Quality hold not found');
    let product_name: string | undefined;
    if (hold.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: hold.product_id } });
      product_name = product?.product_name;
    }
    return { ...hold, product_name };
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const updated = await this.prisma.quality_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        hold_name: dto.hold_name,
        description: dto.description,
        hold_reason: dto.hold_reason,
        hold_reason_code: dto.hold_reason_code,
        affected_quantity: dto.affected_quantity ? dto.affected_quantity : undefined,
        notes: dto.notes,
        updated_by: dto.updated_by,
      },
    });
    let product_name: string | undefined;
    if (updated.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: updated.product_id } });
      product_name = product?.product_name;
    }
    return { ...updated, product_name };
  }

  async delete(tenantId: string, id: string) {
    const entity = await this.findById(tenantId, id);
    await this.prisma.quality_holds.deleteMany({
      where: { tenant_id: tenantId, hold_id: BigInt(id) },
    });
    return entity;
  }

  async release(tenantId: string, id: string, userId: string, reason?: string) {
    const hold = await this.findById(tenantId, id);
    if (hold.status !== 'OPEN') throw new ForbiddenException('Hold is not open');
    await this.prisma.quality_holds.update({
      where: { hold_id: BigInt(id) },
      data: { status: 'RELEASED', released_by_user_id: userId, released_at: new Date(), notes: reason || undefined },
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

    return { message: 'Hold released successfully' };
  }
}
