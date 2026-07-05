import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const client = await this.prisma.clients.create({
      data: {
        tenant_id: tenantId,
        client_code: dto.clientCode,
        client_name: dto.clientName,
        is_active: dto.isActive ?? true,
      },
    });

    if (dto.addresses?.length) {
      await this.prisma.client_addresses.createMany({
        data: dto.addresses.map((a: any) => ({
          tenant_id: tenantId,
          client_id: client.client_id,
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

    if (dto.contacts?.length) {
      await this.prisma.client_contacts.createMany({
        data: dto.contacts.map((c: any) => ({
          tenant_id: tenantId,
          client_id: client.client_id,
          first_name: c.firstName,
          last_name: c.lastName,
          email: c.email,
          phone: c.phone,
          is_primary: c.isPrimary ?? false,
          is_active: true,
        })),
      });
    }

    return this.getClientSummary(tenantId, client.client_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { client_code: { contains: query.search, mode: 'insensitive' } },
        { client_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.clients.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { client_code: 'asc' },
        include: {
          _count: { select: { client_addresses: true, client_contacts: true, client_facility_assignments: true } },
        },
      }),
      this.prisma.clients.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, clientId: bigint) {
    return this.getClientSummary(tenantId, clientId);
  }

  async update(tenantId: string, clientId: bigint, dto: any) {
    const data: any = {};
    if (dto.clientCode !== undefined) data.client_code = dto.clientCode;
    if (dto.clientName !== undefined) data.client_name = dto.clientName;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    await this.prisma.clients.updateMany({
      where: { tenant_id: tenantId, client_id: clientId },
      data,
    });
    return this.getClientSummary(tenantId, clientId);
  }

  async getClientSummary(tenantId: string, clientId: bigint) {
    const client = await this.prisma.clients.findFirst({
      where: { tenant_id: tenantId, client_id: clientId },
    });
    if (!client) return null;

    const [addresses, contacts, assignments] = await Promise.all([
      this.prisma.client_addresses.findMany({
        where: { tenant_id: tenantId, client_id: clientId, is_active: true },
      }),
      this.prisma.client_contacts.findMany({
        where: { tenant_id: tenantId, client_id: clientId, is_active: true },
      }),
      this.prisma.client_facility_assignments.findMany({
        where: { tenant_id: tenantId, client_id: clientId, is_active: true },
        include: {
          warehouse_facilities: { select: { facility_code: true, facility_name: true } },
        },
      }),
    ]);

    return { ...client, addresses, contacts, facilityAssignments: assignments };
  }

  async delete(tenantId: string, clientId: bigint) {
    return this.prisma.clients.deleteMany({
      where: { tenant_id: tenantId, client_id: clientId },
    });
  }

  async assignToFacility(tenantId: string, clientId: bigint, facilityId: bigint) {
    return this.prisma.client_facility_assignments.upsert({
      where: {
        client_id_facility_id_tenant_id: {
          client_id: clientId,
          facility_id: facilityId,
          tenant_id: tenantId,
        },
      },
      create: { tenant_id: tenantId, client_id: clientId, facility_id: facilityId, is_active: true },
      update: { is_active: true },
    });
  }

  async removeFacilityAssignment(tenantId: string, clientId: bigint, facilityId: bigint) {
    return this.prisma.client_facility_assignments.updateMany({
      where: { tenant_id: tenantId, client_id: clientId, facility_id: facilityId },
      data: { is_active: false },
    });
  }

  async addAddress(tenantId: string, clientId: bigint, dto: any) {
    return this.prisma.client_addresses.create({
      data: {
        tenant_id: tenantId,
        client_id: clientId,
        address_type: dto.addressType || 'SHIPPING',
        address_line1: dto.addressLine1,
        address_line2: dto.addressLine2,
        city: dto.city,
        state_province: dto.stateProvince,
        postal_code: dto.postalCode,
        country_code: dto.countryCode || 'US',
        is_default: dto.isDefault ?? false,
        is_active: true,
      },
    });
  }

  async addContact(tenantId: string, clientId: bigint, dto: any) {
    return this.prisma.client_contacts.create({
      data: {
        tenant_id: tenantId,
        client_id: clientId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        is_primary: dto.isPrimary ?? false,
        is_active: true,
      },
    });
  }
}
