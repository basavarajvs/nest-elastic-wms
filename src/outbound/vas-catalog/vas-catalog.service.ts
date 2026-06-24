import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVasServiceDto, UpdateVasServiceDto, SetClientRateDto, CreateWorkstationDto, UpdateWorkstationDto } from './dtos/catalog.dto';

@Injectable()
export class VasCatalogService {
  private readonly logger = new Logger(VasCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createService(dto: CreateVasServiceDto, tenantId: string): Promise<any> {
    return this.prisma.vasService.create({
      data: {
        tenantId,
        serviceCode: dto.serviceCode,
        serviceName: dto.serviceName,
        description: dto.description,
        category: dto.category,
        defaultRate: dto.defaultRate ?? undefined,
        uomId: dto.uomId,
        estimatedTimeMinutes: dto.estimatedTimeMinutes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listServices(tenantId: string, filters?: { category?: string; isActive?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive === 'true';
    return this.prisma.vasService.findMany({ where, orderBy: { serviceCode: 'asc' } });
  }

  async updateService(id: string, dto: UpdateVasServiceDto, tenantId: string): Promise<any> {
    const svc = await this.prisma.vasService.findFirst({ where: { id, tenantId } });
    if (!svc) throw new NotFoundException('VAS service not found');
    return this.prisma.vasService.update({ where: { id }, data: dto });
  }

  async setClientRate(dto: SetClientRateDto, tenantId: string): Promise<any> {
    const svc = await this.prisma.vasService.findFirst({ where: { id: dto.serviceId, tenantId } });
    if (!svc) throw new NotFoundException('VAS service not found');
    return this.prisma.vasServiceClientRate.create({
      data: {
        tenantId,
        serviceId: dto.serviceId,
        clientId: dto.clientId,
        ratePerUnit: dto.ratePerUnit,
        currency: dto.currency ?? 'USD',
        minCharge: dto.minCharge ?? undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async listClientRates(tenantId: string, filters?: { serviceId?: string; clientId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.clientId) where.clientId = filters.clientId;
    return this.prisma.vasServiceClientRate.findMany({
      where,
      include: { service: true },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createWorkstation(dto: CreateWorkstationDto, tenantId: string): Promise<any> {
    return this.prisma.vasWorkstation.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        workstationCode: dto.workstationCode,
        workstationName: dto.workstationName,
        stationType: dto.stationType,
        locationId: dto.locationId,
        capabilities: dto.capabilities ?? undefined,
      },
    });
  }

  async listWorkstations(tenantId: string, filters?: { facilityId?: string; stationType?: string; isAvailable?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.stationType) where.stationType = filters.stationType;
    if (filters?.isAvailable !== undefined) where.isAvailable = filters.isAvailable === 'true';
    return this.prisma.vasWorkstation.findMany({ where, orderBy: { workstationCode: 'asc' } });
  }

  async updateWorkstation(id: string, dto: UpdateWorkstationDto, tenantId: string): Promise<any> {
    const ws = await this.prisma.vasWorkstation.findFirst({ where: { id, tenantId } });
    if (!ws) throw new NotFoundException('VAS workstation not found');
    return this.prisma.vasWorkstation.update({ where: { id }, data: dto });
  }

  async getWorkstation(id: string, tenantId: string): Promise<any> {
    const ws = await this.prisma.vasWorkstation.findFirst({ where: { id, tenantId } });
    if (!ws) throw new NotFoundException('VAS workstation not found');
    return ws;
  }

  async lookupRate(serviceId: string, clientId: string | undefined, tenantId: string): Promise<{ ratePerUnit: number | null }> {
    if (clientId) {
      const clientRate = await this.prisma.vasServiceClientRate.findFirst({
        where: {
          tenantId,
          serviceId,
          clientId,
          isActive: true,
          effectiveDate: { lte: new Date() },
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
        orderBy: { effectiveDate: 'desc' },
      });
      if (clientRate) return { ratePerUnit: Number(clientRate.ratePerUnit) };
    }

    const svc = await this.prisma.vasService.findFirst({ where: { id: serviceId, tenantId } });
    if (svc?.defaultRate) return { ratePerUnit: Number(svc.defaultRate) };
    return { ratePerUnit: null };
  }

  async findServicesByIds(ids: string[], tenantId: string): Promise<any[]> {
    return this.prisma.vasService.findMany({ where: { id: { in: ids }, tenantId } });
  }
}
