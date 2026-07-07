import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      client_code: dto.client_code,
      client_name: dto.client_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.primary_contact_name !== undefined) data.primary_contact_name = dto.primary_contact_name;
    if (dto.primary_contact_email !== undefined) data.primary_contact_email = dto.primary_contact_email;
    if (dto.primary_contact_phone !== undefined) data.primary_contact_phone = dto.primary_contact_phone;
    if (dto.credit_limit !== undefined) data.credit_limit = dto.credit_limit;
    if (dto.payment_terms !== undefined) data.payment_terms = dto.payment_terms;
    if (dto.preferred_carrier_id !== undefined) data.preferred_carrier_id = BigInt(dto.preferred_carrier_id);
    if (dto.delivery_instructions !== undefined) data.delivery_instructions = dto.delivery_instructions;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.client_type !== undefined) data.client_type = dto.client_type;
    const client = await this.prisma.clients.create({ data });

    if (dto.addresses?.length) {
      await this.prisma.client_addresses.createMany({
        data: dto.addresses.map((a: any) => ({
          tenant_id: tenantId,
          client_id: client.client_id,
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

    if (dto.contacts?.length) {
      await this.prisma.client_contacts.createMany({
        data: dto.contacts.map((c: any) => ({
          tenant_id: tenantId,
          client_id: client.client_id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          is_primary: c.is_primary ?? false,
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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
    if (dto.client_code !== undefined) data.client_code = dto.client_code;
    if (dto.client_name !== undefined) data.client_name = dto.client_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.primary_contact_name !== undefined) data.primary_contact_name = dto.primary_contact_name;
    if (dto.primary_contact_email !== undefined) data.primary_contact_email = dto.primary_contact_email;
    if (dto.primary_contact_phone !== undefined) data.primary_contact_phone = dto.primary_contact_phone;
    if (dto.credit_limit !== undefined) data.credit_limit = dto.credit_limit;
    if (dto.payment_terms !== undefined) data.payment_terms = dto.payment_terms;
    if (dto.preferred_carrier_id !== undefined) data.preferred_carrier_id = BigInt(dto.preferred_carrier_id);
    if (dto.delivery_instructions !== undefined) data.delivery_instructions = dto.delivery_instructions;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.client_type !== undefined) data.client_type = dto.client_type;
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
          clients: { select: { client_code: true, client_name: true } },
        },
      }),
    ]);

    return {
      ...client,
      addresses,
      contacts,
      facilityAssignments: assignments.map((a) => ({
        ...a,
        client_name: a.clients?.client_name,
        facility_name: a.warehouse_facilities?.facility_name,
        clients: undefined,
        warehouse_facilities: undefined,
      })),
    };
  }

  async delete(tenantId: string, clientId: bigint) {
    const record = await this.getClientSummary(tenantId, clientId);
    await this.prisma.clients.deleteMany({
      where: { tenant_id: tenantId, client_id: clientId },
    });
    return record;
  }

  async assignToFacility(tenantId: string, clientId: bigint, facilityId: bigint) {
    await this.prisma.client_facility_assignments.upsert({
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
    const assignment = await this.prisma.client_facility_assignments.findFirst({
      where: { tenant_id: tenantId, client_id: clientId, facility_id: facilityId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
        clients: { select: { client_name: true } },
      },
    });
    if (!assignment) return null;
    return {
      ...assignment,
      client_name: assignment.clients?.client_name,
      facility_name: assignment.warehouse_facilities?.facility_name,
      clients: undefined,
      warehouse_facilities: undefined,
    };
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
        address_type: dto.address_type || 'SHIPPING',
        address_line1: dto.address_line1,
        address_line2: dto.address_line2,
        city: dto.city,
        state_province: dto.state_province,
        postal_code: dto.postal_code,
        country_code: dto.country_code || 'US',
        is_default: dto.is_default ?? false,
        is_active: true,
      },
    });
  }

  async addContact(tenantId: string, clientId: bigint, dto: any) {
    return this.prisma.client_contacts.create({
      data: {
        tenant_id: tenantId,
        client_id: clientId,
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        is_primary: dto.is_primary ?? false,
        is_active: true,
      },
    });
  }
}
