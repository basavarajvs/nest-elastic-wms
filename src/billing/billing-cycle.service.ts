import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingCycleDto } from './dtos/billing.dto';

@Injectable()
export class BillingCycleService {
  private readonly logger = new Logger(BillingCycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillingCycleDto, tenantId: string): Promise<any> {
    return this.prisma.billingCycle.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        cycleCode: dto.cycleCode,
        cycleName: dto.cycleName,
        frequency: dto.frequency,
        billingDay: dto.billingDay,
      },
    });
  }

  async list(tenantId: string, filters?: { facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    return this.prisma.billingCycle.findMany({ where, orderBy: { cycleCode: 'asc' } });
  }
}
