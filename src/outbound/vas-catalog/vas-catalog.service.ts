import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VasCatalogService {
  private readonly logger = new Logger(VasCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteService(tenantId: string, id: bigint) {
    return this.prisma.vas_services.deleteMany({
      where: { tenant_id: tenantId, vas_id: id },
    });
  }

  async createService(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.vas_services.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        vas_code: dto.vasCode,
        vas_name: dto.vasName,
        description: dto.description,
        service_category: dto.serviceCategory,
        charge_type: dto.chargeType,
        base_charge: dto.baseCharge,
        currency_code: dto.currencyCode || 'USD',
        uom_id: dto.uomId ? BigInt(dto.uomId) : undefined,
        minimum_charge: dto.minimumCharge,
        maximum_charge: dto.maximumCharge,
        requires_approval: dto.requiresApproval ?? false,
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

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.vas_services.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.vas_services.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findServiceById(tenantId: string, id: bigint) {
    const service = await this.prisma.vas_services.findFirst({
      where: { tenant_id: tenantId, vas_id: id },
    });
    if (!service) throw new NotFoundException('VAS service not found');
    return service;
  }

  async updateService(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findServiceById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.vasName !== undefined) data.vas_name = dto.vasName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.serviceCategory !== undefined) data.service_category = dto.serviceCategory;
    if (dto.chargeType !== undefined) data.charge_type = dto.chargeType;
    if (dto.baseCharge !== undefined) data.base_charge = dto.baseCharge;
    if (dto.currencyCode !== undefined) data.currency_code = dto.currencyCode;
    if (dto.minimumCharge !== undefined) data.minimum_charge = dto.minimumCharge;
    if (dto.maximumCharge !== undefined) data.maximum_charge = dto.maximumCharge;
    if (dto.requiresApproval !== undefined) data.requires_approval = dto.requiresApproval;
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
        service_code: dto.serviceCode,
        client_id: BigInt(dto.clientId),
        client_specific_rate: dto.clientSpecificRate,
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
        facility_id: BigInt(dto.facilityId),
        workstation_code: dto.workstationCode,
        workstation_name: dto.workstationName,
        zone_id: dto.zoneId ? BigInt(dto.zoneId) : undefined,
        aisle: dto.aisle,
        floor_level: dto.floorLevel,
        station_type: dto.stationType,
        supported_services: dto.supportedServices ?? undefined,
        equipment_json: dto.equipmentJson ?? undefined,
        max_concurrent_tasks: dto.maxConcurrentTasks ?? 1,
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

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.vas_workstations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.vas_workstations.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findWorkstationById(tenantId: string, id: bigint) {
    const ws = await this.prisma.vas_workstations.findFirst({
      where: { tenant_id: tenantId, workstation_id: id },
    });
    if (!ws) throw new NotFoundException('Workstation not found');
    return ws;
  }

  async updateWorkstation(tenantId: string, id: bigint, userId: string | undefined, dto: any) {
    await this.findWorkstationById(tenantId, id);
    const data: Record<string, any> = { updated_by: userId ? BigInt(userId) : undefined };
    if (dto.workstationName !== undefined) data.workstation_name = dto.workstationName;
    if (dto.stationType !== undefined) data.station_type = dto.stationType;
    if (dto.supportedServices !== undefined) data.supported_services = dto.supportedServices;
    if (dto.maxConcurrentTasks !== undefined) data.max_concurrent_tasks = dto.maxConcurrentTasks;

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
