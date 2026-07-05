import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QualityHoldService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.quality_holds.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        hold_number: dto.holdNumber,
        hold_name: dto.holdName,
        description: dto.description,
        reference_type: dto.referenceType,
        reference_id: BigInt(dto.referenceId || 0),
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        lot_id: dto.lotId ? BigInt(dto.lotId) : undefined,
        location_id: dto.locationId ? BigInt(dto.locationId) : undefined,
        hold_reason: dto.holdReason,
        hold_reason_code: dto.holdReasonCode,
        placed_by_user_id: dto.placedByUserId,
        affected_quantity: dto.affectedQuantity ? dto.affectedQuantity : undefined,
        uom_id: dto.uomId ? BigInt(dto.uomId) : undefined,
        notes: dto.notes,
        created_by: dto.createdBy,
        status: 'OPEN',
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, holdReason, productId, referenceType, page = 1, limit = 50 } = query;
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
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const hold = await this.prisma.quality_holds.findUnique({
      where: { hold_id: BigInt(id) },
    });
    if (!hold) throw new NotFoundException('Quality hold not found');
    return hold;
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    return this.prisma.quality_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        hold_name: dto.holdName,
        description: dto.description,
        hold_reason: dto.holdReason,
        hold_reason_code: dto.holdReasonCode,
        affected_quantity: dto.affectedQuantity ? dto.affectedQuantity : undefined,
        notes: dto.notes,
        updated_by: dto.updatedBy,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.prisma.quality_holds.deleteMany({
      where: { tenant_id: tenantId, hold_id: BigInt(id) },
    });
    return { message: 'Quality hold deleted successfully' };
  }

  async release(tenantId: string, id: string, userId: string, reason?: string) {
    const hold = await this.findById(tenantId, id);
    if (hold.status !== 'OPEN') throw new ForbiddenException('Hold is not open');
    await this.prisma.quality_holds.update({
      where: { hold_id: BigInt(id) },
      data: { status: 'RELEASED', released_by_user_id: userId, released_at: new Date(), notes: reason || undefined },
    });
    return { message: 'Hold released successfully' };
  }
}
