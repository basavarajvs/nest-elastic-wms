import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRateDto, CreateClientRateDto, ListRatesDto } from './dtos/billing.dto';

@Injectable()
export class StorageRateService {
  private readonly logger = new Logger(StorageRateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRate(dto: CreateRateDto, tenantId: string): Promise<any> {
    return this.prisma.storageRateMaster.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        rateCode: dto.rateCode,
        rateName: dto.rateName,
        rateType: dto.rateType,
        calculationBasis: dto.calculationBasis,
        defaultRate: dto.defaultRate,
        currency: dto.currency ?? 'USD',
        minCharge: dto.minCharge ?? undefined,
        maxCharge: dto.maxCharge ?? undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listRates(tenantId: string, filters?: ListRatesDto): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.rateType) where.rateType = filters.rateType;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive === 'true';
    return this.prisma.storageRateMaster.findMany({
      where,
      include: { clientRates: true },
      orderBy: { rateCode: 'asc' },
    });
  }

  async getRate(id: string, tenantId: string): Promise<any> {
    const rate = await this.prisma.storageRateMaster.findFirst({
      where: { id, tenantId },
      include: { clientRates: true },
    });
    if (!rate) throw new NotFoundException('Storage rate not found');
    return rate;
  }

  async setClientRate(dto: CreateClientRateDto, tenantId: string): Promise<any> {
    const rateMaster = await this.prisma.storageRateMaster.findFirst({
      where: { id: dto.rateMasterId, tenantId },
    });
    if (!rateMaster) throw new NotFoundException('Storage rate master not found');
    return this.prisma.storageClientRate.create({
      data: {
        tenantId,
        rateMasterId: dto.rateMasterId,
        clientId: dto.clientId,
        negotiatedRate: dto.negotiatedRate,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async listClientRates(tenantId: string, filters?: { rateMasterId?: string; clientId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.rateMasterId) where.rateMasterId = filters.rateMasterId;
    if (filters?.clientId) where.clientId = filters.clientId;
    return this.prisma.storageClientRate.findMany({
      where,
      include: { rateMaster: true },
      orderBy: { effectiveDate: 'desc' },
    });
  }
}
