import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { lpn_transaction_type } from '@prisma/client';

@Injectable()
export class LpnService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    const entity = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: id },
    });
    await this.prisma.license_plate_numbers.deleteMany({
      where: { tenant_id: tenantId, lpn_id: id },
    });
    return entity;
  }

  async create(tenantId: string, dto: any) {
    const { facility_id, location_id, product_id, lpn_number, status, parent_lpn_id, grn_line_id, assigned_shipment_id, assigned_load_id, staging_location_id, ...rest } = dto;
    return this.prisma.license_plate_numbers.create({
      data: {
        tenant_id: tenantId,
        facility_id: facility_id ? BigInt(facility_id) : undefined,
        location_id: location_id ? BigInt(location_id) : undefined,
        product_id: product_id ? BigInt(product_id) : undefined,
        lpn_number,
        status,
        parent_lpn_id: parent_lpn_id ? BigInt(parent_lpn_id) : undefined,
        grn_line_id: grn_line_id ? BigInt(grn_line_id) : undefined,
        assigned_shipment_id: assigned_shipment_id ? BigInt(assigned_shipment_id) : undefined,
        assigned_load_id: assigned_load_id ? BigInt(assigned_load_id) : undefined,
        staging_location_id: staging_location_id ? BigInt(staging_location_id) : undefined,
        ...rest,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, locationId } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
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
    const facilityIds = [...new Set(data.map(l => l.facility_id))];
    const locationIds = [...new Set(data.map(l => l.location_id))];
    const productIds = [...new Set(data.filter(l => l.product_id).map(l => l.product_id!))];
    const [facilities, locations, products] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } }) : [],
      locationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: locationIds } }, select: { location_id: true, location_name: true } }) : [],
      productIds.length ? this.prisma.products.findMany({ where: { product_id: { in: productIds } }, select: { product_id: true, product_name: true } }) : [],
    ]);
    const facilityMap = new Map<string, string>(facilities.map(f => [f.facility_id.toString(), f.facility_name] as [string, string]));
    const locationMap = new Map<string, string>(locations.map(l => [l.location_id.toString(), l.location_name] as [string, string]));
    const productMap = new Map<string, string>(products.map(p => [p.product_id.toString(), p.product_name] as [string, string]));
    const mappedData = data.map(l => ({
      ...l,
      facility_name: facilityMap.get(l.facility_id.toString()) ?? null,
      location_name: locationMap.get(l.location_id.toString()) ?? null,
      product_name: l.product_id ? productMap.get(l.product_id.toString()) ?? null : null,
    }));
    return { data: mappedData, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: BigInt(id) },
      include: { lpn_transactions: true },
    });
    if (!lpn) throw new NotFoundException('LPN not found');
    const [facility, location, product] = await Promise.all([
      this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: tenantId, facility_id: lpn.facility_id }, select: { facility_name: true } }),
      this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: lpn.location_id }, select: { location_name: true } }),
      lpn.product_id ? this.prisma.products.findFirst({ where: { product_id: lpn.product_id }, select: { product_name: true } }) : null,
    ]);
    return {
      ...lpn,
      facility_name: facility?.facility_name ?? null,
      location_name: location?.location_name ?? null,
      product_name: product?.product_name ?? null,
    };
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_number: barcode },
    });
    if (!lpn) return null;
    const [facility, location, product] = await Promise.all([
      this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: tenantId, facility_id: lpn.facility_id }, select: { facility_name: true } }),
      this.prisma.storage_locations.findFirst({ where: { tenant_id: tenantId, location_id: lpn.location_id }, select: { location_name: true } }),
      lpn.product_id ? this.prisma.products.findFirst({ where: { product_id: lpn.product_id }, select: { product_name: true } }) : null,
    ]);
    return {
      ...lpn,
      facility_name: facility?.facility_name ?? null,
      location_name: location?.location_name ?? null,
      product_name: product?.product_name ?? null,
    };
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facility_id, location_id, product_id, lpn_number, parent_lpn_id, grn_line_id, assigned_shipment_id, assigned_load_id, staging_location_id, ...rest } = dto;
    return this.prisma.license_plate_numbers.update({
      where: { lpn_id: BigInt(id) },
      data: {
        ...(facility_id !== undefined ? { facility_id: BigInt(facility_id) } : {}),
        ...(location_id !== undefined ? { location_id: BigInt(location_id) } : {}),
        ...(product_id !== undefined ? { product_id: BigInt(product_id) } : {}),
        ...(lpn_number !== undefined ? { lpn_number: lpn_number } : {}),
        ...(parent_lpn_id !== undefined ? { parent_lpn_id: BigInt(parent_lpn_id) } : {}),
        ...(grn_line_id !== undefined ? { grn_line_id: BigInt(grn_line_id) } : {}),
        ...(assigned_shipment_id !== undefined ? { assigned_shipment_id: BigInt(assigned_shipment_id) } : {}),
        ...(assigned_load_id !== undefined ? { assigned_load_id: BigInt(assigned_load_id) } : {}),
        ...(staging_location_id !== undefined ? { staging_location_id: BigInt(staging_location_id) } : {}),
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
    const data = await this.prisma.lpn_transactions.findMany({
      where: { tenant_id: tenantId, lpn_id: BigInt(lpnId) },
      orderBy: { created_at: 'desc' },
    });
    const facilityIds = [...new Set(data.map(t => t.facility_id))];
    const fromLocationIds = [...new Set(data.filter(t => t.from_location_id).map(t => t.from_location_id!))];
    const toLocationIds = [...new Set(data.filter(t => t.to_location_id).map(t => t.to_location_id!))];
    const allLocationIds = [...new Set([...fromLocationIds, ...toLocationIds])];
    const [facilities, locations] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } }) : [],
      allLocationIds.length ? this.prisma.storage_locations.findMany({ where: { tenant_id: tenantId, location_id: { in: allLocationIds } }, select: { location_id: true, location_name: true } }) : [],
    ]);
    const facilityMap = new Map<string, string>(facilities.map(f => [f.facility_id.toString(), f.facility_name] as [string, string]));
    const locationMap = new Map<string, string>(locations.map(l => [l.location_id.toString(), l.location_name] as [string, string]));
    return data.map(t => ({
      ...t,
      facility_name: facilityMap.get(t.facility_id.toString()) ?? null,
      from_location_name: t.from_location_id ? locationMap.get(t.from_location_id.toString()) ?? null : null,
      to_location_name: t.to_location_id ? locationMap.get(t.to_location_id.toString()) ?? null : null,
    }));
  }
}
