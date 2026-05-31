import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CycleCountService } from './cycle-count.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('count-scheduler')
export class CountSchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(CountSchedulerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly countService: CycleCountService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const startTime = Date.now();
    this.logger.log('Running count scheduler...');

    const tenants = await (this.prisma as any).$queryRawUnsafe(`
      SELECT DISTINCT tenant_id, facility_id FROM multitenant.cycle_counts WHERE frequency_type IN ('ABC_DRIVEN', 'QUARTERLY') AND status != 'CANCELLED'
    `);

    let totalGenerated = 0;
    let failedCount = 0;
    const failedProducts: string[] = [];

    const chunkSize = 100;
    for (const row of (tenants as any[]) || []) {
      const abcItems = await (this.prisma as any).$queryRawUnsafe(`
        SELECT ioh.product_id, ioh.facility_id, p.velocity_class FROM multitenant.inventory_on_hand ioh
        JOIN multitenant.products p ON p.id = ioh.product_id
        WHERE ioh.tenant_id = $1::uuid AND p.velocity_class = 'A'
        AND NOT EXISTS (SELECT 1 FROM multitenant.cycle_counts cc2 WHERE cc2.tenant_id = ioh.tenant_id AND cc2.status = 'SCHEDULED')
        LIMIT ${chunkSize}
      `, row.tenant_id);

      const chunks = this.chunkArray(abcItems as any[], chunkSize);
      for (const chunk of chunks) {
        try {
          await (this.prisma as any).$transaction(async (tx: any) => {
            for (const item of chunk) {
              await tx.cycleCount.create({
                data: {
                  tenantId: row.tenant_id,
                  facilityId: row.facility_id,
                  countNumber: `CC-AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  countMethod: 'BLIND',
                  scopeType: 'ABC_CLASS',
                  scopeIdentifier: 'A',
                  frequencyType: 'ABC_DRIVEN',
                },
              });
              totalGenerated++;
            }
          });
        } catch (err: any) {
          failedCount++;
          failedProducts.push(...chunk.map((c: any) => c.product_id));
          this.logger.error(`Chunk failed: ${err.message}`);
        }
      }

      const duration = Date.now() - startTime;
      await (this.prisma as any).countSchedulerMetric.create({
        data: {
          tenantId: row.tenant_id,
          runAt: new Date(),
          generationDurationMs: duration,
          successRate: totalGenerated > 0 ? (totalGenerated - failedCount) / totalGenerated : 0,
          totalGenerated,
          failedProductCodes: failedProducts.length > 0 ? failedProducts : undefined,
        },
      });
    }

    this.logger.log(`Count scheduler: ${totalGenerated} generated, ${failedCount} failed`);
    return { totalGenerated, failedCount, durationMs: Date.now() - startTime };
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }
}
