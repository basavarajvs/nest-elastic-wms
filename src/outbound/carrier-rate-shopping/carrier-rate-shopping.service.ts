import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarrierRateDto, RateQuoteRequestDto, CompareRatesDto } from './dtos/carrier-rate.dto';

@Injectable()
export class CarrierRateShoppingService {
  private readonly logger = new Logger(CarrierRateShoppingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRate(dto: CreateCarrierRateDto, tenantId: string): Promise<any> {
    const carrier = await (this.prisma as any).carrier.findFirst({
      where: { id: dto.carrierId, tenantId },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');

    return (this.prisma as any).carrierRate.create({
      data: {
        tenantId,
        carrierId: dto.carrierId,
        serviceCode: dto.serviceCode,
        serviceName: dto.serviceName,
        zone: dto.zone,
        weightFrom: dto.weightFrom,
        weightTo: dto.weightTo,
        baseRate: dto.baseRate,
        ratePerKg: dto.ratePerKg,
        fuelSurcharge: dto.fuelSurcharge,
        minCharge: dto.minCharge,
        transitDaysMin: dto.transitDaysMin,
        transitDaysMax: dto.transitDaysMax,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : new Date(),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findRates(tenantId: string, carrierId?: string): Promise<any> {
    const where: any = { tenantId, isActive: true };
    if (carrierId) where.carrierId = carrierId;
    return (this.prisma as any).carrierRate.findMany({
      where,
      orderBy: [{ carrierId: 'asc' }, { zone: 'asc' }],
    });
  }

  async getQuote(dto: RateQuoteRequestDto, tenantId: string): Promise<any> {
    const where: any = {
      tenantId,
      carrierId: dto.carrierId,
      isActive: true,
      zone: dto.destinationZone,
      weightFrom: { lte: dto.weight },
      weightTo: { gte: dto.weight },
    };
    if (dto.serviceCodes?.length) where.serviceCode = { in: dto.serviceCodes };

    const rates = await (this.prisma as any).carrierRate.findMany({ where });

    return rates.map((rate: any) => {
      const weightCharge = (Number(rate.ratePerKg) || 0) * dto.weight;
      const subtotal = Number(rate.baseRate) + weightCharge;
      const fuel = subtotal * (Number(rate.fuelSurcharge) || 0) / 100;
      const total = Math.max(subtotal + fuel, Number(rate.minCharge) || 0);
      return {
        carrierId: dto.carrierId,
        serviceCode: rate.serviceCode,
        serviceName: rate.serviceName,
        baseRate: Number(rate.baseRate),
        weightCharge,
        fuelSurcharge: fuel,
        total,
        transitDays: { min: rate.transitDaysMin, max: rate.transitDaysMax },
      };
    });
  }

  async compareRates(dto: CompareRatesDto, tenantId: string): Promise<any> {
    const results: any[] = [];
    for (const carrierId of dto.carrierIds) {
      const quotes = await this.getQuote({
        carrierId,
        weight: dto.weight,
        destinationZone: dto.destinationZone,
      }, tenantId);
      results.push(...quotes);
    }
    results.sort((a: any, b: any) => a.total - b.total);
    return results;
  }

  async deleteRate(id: string, tenantId: string): Promise<void> {
    const rate = await (this.prisma as any).carrierRate.findFirst({ where: { id, tenantId } });
    if (!rate) throw new NotFoundException('Carrier rate not found');
    await (this.prisma as any).carrierRate.delete({ where: { id } });
  }
}
