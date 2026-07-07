import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VasCatalogService {
  private readonly logger = new Logger(VasCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteService(tenantId: string, id: bigint) {
    const service = await this.findServiceById(tenantId, id);
    await this.prisma.vas_services.deleteMany({
      where: { tenant_id: tenantId, vas_id: id },
    });
    return service;
  }

  async createService(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.vas_services.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        vas_code: dto.vas_code,
        vas_name: dto.vas_name,
        description: dto.description,
        service_category: dto.service_category,
        charge_type: dto.charge_type,
        base_charge: dto.base_charge,
        currency_code: dto.currency_code || 'USD',
        uom_id: dto.uom_id ? BigInt(dto.uom_id) : undefined,
        minimum_charge: dto.minimum_charge,
        maximum_charge: dto.maximum_charge,
        requires_approval: dto.requires_approval ?? false,
        is_active: dto.isActive ?? true,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async findAllServices(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.serviceCategory) where.service_category = query.serviceCategory;
    if (query.isActive !== undefined) where.is_active = query.isActive === 'true' || query.isActive === true;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [rows, total] = await Promise.all([
      this.prisma.vas_services.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.vas_services.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    }));
    return { data, total, page, limit };
  }

  async findServiceById(tenantId: string, id: bigint) {
    const service = await this.prisma.vas_services.findFirst({
      where: { tenant_id: tenantId, vas_id: id },
      include: { warehouse_facilities: true },
    });
    if (!service) throw new NotFoundException('VAS service not found');
    return {
      ...service,
      facility_name: service.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    };
  }

  async updateService(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findServiceById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.vas_name !== undefined) data.vas_name = dto.vas_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.service_category !== undefined) data.service_category = dto.service_category;
    if (dto.charge_type !== undefined) data.charge_type = dto.charge_type;
    if (dto.base_charge !== undefined) data.base_charge = dto.base_charge;
    if (dto.currency_code !== undefined) data.currency_code = dto.currency_code;
    if (dto.minimum_charge !== undefined) data.minimum_charge = dto.minimum_charge;
    if (dto.maximum_charge !== undefined) data.maximum_charge = dto.maximum_charge;
    if (dto.requires_approval !== undefined) data.requires_approval = dto.requires_approval;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;

    await this.prisma.vas_services.updateMany({
      where: { tenant_id: tenantId, vas_id: id },
      data,
    });
    return this.findServiceById(tenantId, id);
  }

  async createClientRate(tenantId: string, dto: any) {
    return this.prisma.vas_service_client_rates.create({
      data: {
        service_code: dto.service_code,
        client_id: BigInt(dto.clientId),
        client_specific_rate: dto.client_specific_rate,
        currency: dto.currency || 'USD',
        tenant_id: tenantId,
      },
    });
  }

  async findAllClientRates(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.serviceCode) where.service_code = query.serviceCode;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    return this.prisma.vas_service_client_rates.findMany({ where });
  }

  async findClientRateWithFallback(tenantId: string, serviceCode: string, clientId: bigint) {
    const clientRate = await this.prisma.vas_service_client_rates.findFirst({
      where: { tenant_id: tenantId, service_code: serviceCode, client_id: clientId },
    });
    if (clientRate?.client_specific_rate) {
      return { rate: clientRate.client_specific_rate, source: 'client' };
    }
    const catalog = await this.prisma.vas_service_catalog.findFirst({
      where: { service_code: serviceCode },
    });
    if (catalog?.standard_rate) {
      return { rate: catalog.standard_rate, source: 'catalog' };
    }
    return { rate: null, source: 'none' };
  }

  async createWorkstation(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.vas_workstations.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        workstation_code: dto.workstation_code,
        workstation_name: dto.workstation_name,
        zone_id: dto.zoneId ? BigInt(dto.zoneId) : undefined,
        aisle: dto.aisle,
        floor_level: dto.floor_level,
        station_type: dto.station_type,
        supported_services: dto.supported_services ?? undefined,
        equipment_json: dto.equipment_json ?? undefined,
        max_concurrent_tasks: dto.max_concurrent_tasks ?? 1,
        current_active_tasks: 0,
        status: 'AVAILABLE',
        is_active: true,
        created_by: userId ? BigInt(userId) : undefined,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });
  }

  async findAllWorkstations(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.stationType) where.station_type = query.stationType;
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [rows, total] = await Promise.all([
      this.prisma.vas_workstations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.vas_workstations.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    }));
    return { data, total, page, limit };
  }

  async findWorkstationById(tenantId: string, id: bigint) {
    const ws = await this.prisma.vas_workstations.findFirst({
      where: { tenant_id: tenantId, workstation_id: id },
      include: { warehouse_facilities: true },
    });
    if (!ws) throw new NotFoundException('Workstation not found');
    return {
      ...ws,
      facility_name: ws.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    };
  }

  async updateWorkstation(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findWorkstationById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId ? BigInt(userId) : undefined };
    if (dto.workstation_name !== undefined) data.workstation_name = dto.workstation_name;
    if (dto.zone_id !== undefined) data.zone_id = dto.zone_id ? BigInt(dto.zone_id) : null;
    if (dto.aisle !== undefined) data.aisle = dto.aisle;
    if (dto.floor_level !== undefined) data.floor_level = dto.floor_level;
    if (dto.station_type !== undefined) data.station_type = dto.station_type;
    if (dto.supported_services !== undefined) data.supported_services = dto.supported_services;
    if (dto.equipment_json !== undefined) data.equipment_json = dto.equipment_json;
    if (dto.max_concurrent_tasks !== undefined) data.max_concurrent_tasks = dto.max_concurrent_tasks;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    await this.prisma.vas_workstations.updateMany({
      where: { tenant_id: tenantId, workstation_id: id },
      data,
    });
    return this.findWorkstationById(tenantId, id);
  }

  async checkInWorkstation(tenantId: string, id: bigint, userId: string | undefined) {
    const ws = await this.findWorkstationById(tenantId, id);
    if (ws.status === 'OCCUPIED') throw new BadRequestException('Workstation already occupied');

    await this.prisma.vas_workstations.updateMany({
      where: { tenant_id: tenantId, workstation_id: id },
      data: {
        status: 'OCCUPIED',
        assigned_user_id: userId ? BigInt(userId) : undefined,
        last_used_at: new Date(),
        current_active_tasks: (ws.current_active_tasks ?? 0) + 1,
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });
    return this.findWorkstationById(tenantId, id);
  }

  async checkOutWorkstation(tenantId: string, id: bigint, userId: string | undefined) {
    const ws = await this.findWorkstationById(tenantId, id);
    if (ws.status !== 'OCCUPIED') throw new BadRequestException('Workstation is not occupied');

    await this.prisma.vas_workstations.updateMany({
      where: { tenant_id: tenantId, workstation_id: id },
      data: {
        status: 'AVAILABLE',
        assigned_user_id: null,
        current_active_tasks: Math.max(0, (ws.current_active_tasks ?? 1) - 1),
        updated_by: userId ? BigInt(userId) : undefined,
      },
    });
    return this.findWorkstationById(tenantId, id);
  }
}
