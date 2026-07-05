import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { lpn_transaction_type } from '@prisma/client';

@Injectable()
export class LpnService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.license_plate_numbers.deleteMany({
      where: { tenant_id: tenantId, lpn_id: id },
    });
  }

  async create(tenantId: string, dto: any) {
    const { facilityId, locationId, productId, lpnNumber: lpn_number, status, ...rest } = dto;
    return this.prisma.license_plate_numbers.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId ? BigInt(facilityId) : undefined,
        location_id: locationId ? BigInt(locationId) : undefined,
        product_id: productId ? BigInt(productId) : undefined,
        lpn_number,
        status,
        ...rest,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, locationId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (status) where.status = status;
    if (locationId) where.location_id = BigInt(locationId);
    const [data, total] = await Promise.all([
      this.prisma.license_plate_numbers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.license_plate_numbers.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: BigInt(id) },
      include: { lpn_transactions: true },
    });
    if (!lpn) throw new NotFoundException('LPN not found');
    return lpn;
  }

  async findByBarcode(tenantId: string, barcode: string) {
    return this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_number: barcode },
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facilityId, locationId, productId, lpnNumber, ...rest } = dto;
    return this.prisma.license_plate_numbers.update({
      where: { lpn_id: BigInt(id) },
      data: {
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...(locationId !== undefined ? { location_id: BigInt(locationId) } : {}),
        ...(productId !== undefined ? { product_id: BigInt(productId) } : {}),
        ...(lpnNumber !== undefined ? { lpn_number: lpnNumber } : {}),
        ...rest,
      },
    });
  }

  async moveLpn(tenantId: string, lpnId: string, newLocationId: string, userId: string) {
    const lpn = await this.findById(tenantId, lpnId);
    const oldLocationId = lpn.location_id;
    const result = await this.prisma.license_plate_numbers.update({
      where: { lpn_id: BigInt(lpnId) },
      data: { location_id: BigInt(newLocationId) },
    });
    await this.prisma.lpn_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: lpn.facility_id,
        lpn_id: BigInt(lpnId),
        from_location_id: oldLocationId,
        to_location_id: BigInt(newLocationId),
        transaction_type: lpn_transaction_type.MOVED,
        performed_by_user_id: userId,
      },
    });
    return result;
  }

  async getTransactions(tenantId: string, lpnId: string) {
    return this.prisma.lpn_transactions.findMany({
      where: { tenant_id: tenantId, lpn_id: BigInt(lpnId) },
      orderBy: { created_at: 'desc' },
    });
  }
}
