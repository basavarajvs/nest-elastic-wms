import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FulfillmentBillingService {
  private readonly logger = new Logger(FulfillmentBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createRun(params: {
    tenantId: string;
    facilityId: string;
    runType: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<any> {
    const count = await this.prisma.fulfillmentBillingRun.count({
      where: { tenantId: params.tenantId },
    });
    const runNumber = `BR-${(count + 1).toString().padStart(6, '0')}`;

    const run = await this.prisma.fulfillmentBillingRun.create({
      data: {
        tenantId: params.tenantId,
        facilityId: params.facilityId,
        runNumber,
        runType: params.runType,
        periodStart: new Date(params.periodStart),
        periodEnd: new Date(params.periodEnd),
        totalTransactions: 0,
        totalAmount: 0,
        status: 'PENDING',
      },
    });

    this.eventEmitter.emit('fulfillment.billing.run.created', run);
    return run;
  }

  async findAll(tenantId: string, filters?: {
    facilityId?: string;
    status?: string;
    runType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.status) where.status = filters.status;
    if (filters?.runType) where.runType = filters.runType;

    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.fulfillmentBillingRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.fulfillmentBillingRun.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const run = await this.prisma.fulfillmentBillingRun.findFirst({
      where: { id, tenantId },
      include: {
        events: {
          orderBy: { eventDate: 'asc' },
        },
      },
    });
    if (!run) throw new NotFoundException('Billing run not found');
    return run;
  }

  async executeRun(id: string, tenantId: string): Promise<any> {
    const run = await this.findById(id, tenantId);
    if (run.status !== 'PENDING') {
      throw new BadRequestException(`Cannot execute run in status ${run.status}`);
    }

    try {
      const updated = await this.prisma.fulfillmentBillingRun.update({
        where: { id },
        data: {
          status: 'EXECUTING',
          executedAt: new Date(),
        },
      });
      this.eventEmitter.emit('fulfillment.billing.run.executed', updated);
      return updated;
    } catch (err: any) {
      await this.prisma.fulfillmentBillingRun.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorDetails: err.message,
        },
      });
      throw err;
    }
  }
}
