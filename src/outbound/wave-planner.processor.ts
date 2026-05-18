import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaveService } from './wave.service';

@Processor('wave-planner')
export class WavePlannerProcessor extends WorkerHost {
  private readonly logger = new Logger(WavePlannerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waveService: WaveService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log('Running wave planner...');

    const orders = await (this.prisma as any).salesOrder.findMany({
      where: { status: 'ALLOCATED' },
      take: 50,
      orderBy: { priority: 'asc' },
    });

    if (orders.length === 0) {
      this.logger.log('No allocable orders found');
      return { ordersProcessed: 0 };
    }

    const grouped = new Map<string, any[]>();
    for (const order of orders) {
      const key = `${order.tenantId}:${order.facilityId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(order);
    }

    let totalProcessed = 0;
    for (const [, group] of grouped) {
      const wave = await this.waveService.create({ facilityId: group[0].facilityId }, group[0].tenantId);
      await this.waveService.releaseWave(wave.id, group[0].tenantId);
      totalProcessed += group.length;
    }

    this.logger.log(`Wave planner processed ${totalProcessed} orders`);
    return { ordersProcessed: totalProcessed };
  }
}
