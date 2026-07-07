import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      vendor_code: dto.vendor_code,
      vendor_name: dto.vendor_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.primary_contact_name !== undefined) data.primary_contact_name = dto.primary_contact_name;
    if (dto.primary_contact_email !== undefined) data.primary_contact_email = dto.primary_contact_email;
    if (dto.primary_contact_phone !== undefined) data.primary_contact_phone = dto.primary_contact_phone;
    if (dto.payment_terms !== undefined) data.payment_terms = dto.payment_terms;
    if (dto.tax_id_number !== undefined) data.tax_id_number = dto.tax_id_number;
    if (dto.performance_score !== undefined) data.performance_score = dto.performance_score;
    if (dto.preferred_status !== undefined) data.preferred_status = dto.preferred_status;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    const vendor = await this.prisma.vendors.create({ data });
    if (dto.contacts?.length) {
      await this.prisma.vendor_contacts.createMany({
        data: dto.contacts.map((c: any) => ({
          tenant_id: tenantId,
          vendor_id: vendor.vendor_id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          is_primary: c.is_primary ?? false,
          is_active: true,
        })),
      });
    }
    if (dto.addresses?.length) {
      await this.prisma.vendor_addresses.createMany({
        data: dto.addresses.map((a: any) => ({
          tenant_id: tenantId,
          vendor_id: vendor.vendor_id,
          address_type: a.address_type || 'SHIPPING',
          address_line1: a.address_line1,
          address_line2: a.address_line2,
          city: a.city,
          state_province: a.state_province,
          postal_code: a.postal_code,
          country_code: a.country_code || 'US',
          is_default: a.is_default ?? false,
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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
    const record = await this.findById(tenantId, vendorId);
    await this.prisma.vendors.deleteMany({
      where: { tenant_id: tenantId, vendor_id: vendorId },
    });
    return record;
  }

  async update(tenantId: string, vendorId: bigint, dto: any) {
    const data: any = {};
    if (dto.vendor_code !== undefined) data.vendor_code = dto.vendor_code;
    if (dto.vendor_name !== undefined) data.vendor_name = dto.vendor_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.primary_contact_name !== undefined) data.primary_contact_name = dto.primary_contact_name;
    if (dto.primary_contact_email !== undefined) data.primary_contact_email = dto.primary_contact_email;
    if (dto.primary_contact_phone !== undefined) data.primary_contact_phone = dto.primary_contact_phone;
    if (dto.payment_terms !== undefined) data.payment_terms = dto.payment_terms;
    if (dto.tax_id_number !== undefined) data.tax_id_number = dto.tax_id_number;
    if (dto.performance_score !== undefined) data.performance_score = dto.performance_score;
    if (dto.preferred_status !== undefined) data.preferred_status = dto.preferred_status;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    await this.prisma.vendors.updateMany({
      where: { tenant_id: tenantId, vendor_id: vendorId },
      data,
    });
    return this.findById(tenantId, vendorId);
  }
}
