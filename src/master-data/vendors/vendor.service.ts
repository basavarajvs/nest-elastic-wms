import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const vendor = await this.prisma.vendors.create({
      data: {
        tenant_id: tenantId,
        vendor_code: dto.vendorCode,
        vendor_name: dto.vendorName,
        is_active: dto.isActive ?? true,
      },
    });
    if (dto.contacts?.length) {
      await this.prisma.vendor_contacts.createMany({
        data: dto.contacts.map((c: any) => ({
          tenant_id: tenantId,
          vendor_id: vendor.vendor_id,
          first_name: c.firstName,
          last_name: c.lastName,
          email: c.email,
          phone: c.phone,
          is_primary: c.isPrimary ?? false,
          is_active: true,
        })),
      });
    }
    if (dto.addresses?.length) {
      await this.prisma.vendor_addresses.createMany({
        data: dto.addresses.map((a: any) => ({
          tenant_id: tenantId,
          vendor_id: vendor.vendor_id,
          address_type: a.addressType || 'SHIPPING',
          address_line1: a.addressLine1,
          address_line2: a.addressLine2,
          city: a.city,
          state_province: a.stateProvince,
          postal_code: a.postalCode,
          country_code: a.countryCode || 'US',
          is_default: a.isDefault ?? false,
          is_active: true,
        })),
      });
    }
    return vendor;
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { vendor_code: { contains: query.search, mode: 'insensitive' } },
        { vendor_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.vendors.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { vendor_code: 'asc' },
      }),
      this.prisma.vendors.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, vendorId: bigint) {
    const vendor = await this.prisma.vendors.findFirst({
      where: { tenant_id: tenantId, vendor_id: vendorId },
    });
    if (!vendor) return null;
    const [contacts, addresses] = await Promise.all([
      this.prisma.vendor_contacts.findMany({
        where: { tenant_id: tenantId, vendor_id: vendorId, is_active: true },
      }),
      this.prisma.vendor_addresses.findMany({
        where: { tenant_id: tenantId, vendor_id: vendorId, is_active: true },
      }),
    ]);
    return { ...vendor, contacts, addresses };
  }

  async delete(tenantId: string, vendorId: bigint) {
    return this.prisma.vendors.deleteMany({
      where: { tenant_id: tenantId, vendor_id: vendorId },
    });
  }

  async update(tenantId: string, vendorId: bigint, dto: any) {
    return this.prisma.vendors.updateMany({
      where: { tenant_id: tenantId, vendor_id: vendorId },
      data: { vendor_code: dto.vendorCode, vendor_name: dto.vendorName, is_active: dto.isActive },
    });
  }
}
