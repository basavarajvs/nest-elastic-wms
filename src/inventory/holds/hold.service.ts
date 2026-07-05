import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupervisorPinService } from '../../security/supervisor-pin.service';

@Injectable()
export class HoldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supervisorPinService: SupervisorPinService,
  ) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_holds.deleteMany({
      where: { tenant_id: tenantId, hold_id: id },
    });
  }

  async create(tenantId: string, dto: any) {
    return this.prisma.inventory_holds.create({
      data: { tenant_id: tenantId, ...dto },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { productId, locationId, status, holdReason, facilityId, page = 1, limit = 50 } = query;
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
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const hold = await this.prisma.inventory_holds.findFirst({
      where: { tenant_id: tenantId, hold_id: BigInt(id) },
    });
    if (!hold) throw new NotFoundException('Hold not found');
    return hold;
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facilityId, ...rest } = dto;
    return this.prisma.inventory_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...rest,
      },
    });
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

    return this.prisma.inventory_holds.update({
      where: { hold_id: BigInt(id) },
      data: {
        status: 'RELEASED',
        released_by_user_id: userId,
        released_at: new Date(),
        release_notes: reason || null,
      },
    });
  }

  async findByLpnId(tenantId: string, lpnId: string) {
    return this.prisma.inventory_holds.findMany({
      where: { tenant_id: tenantId, lpn_id: BigInt(lpnId), status: 'ACTIVE' },
    });
  }
}
