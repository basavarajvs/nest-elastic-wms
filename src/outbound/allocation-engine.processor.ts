import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AllocationService } from './allocation.service';

@Processor('allocation-engine')
export class AllocationEngineProcessor extends WorkerHost {
  private readonly logger = new Logger(AllocationEngineProcessor.name);

  constructor(private readonly allocationService: AllocationService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { orderId, tenantId } = job.data;
    this.logger.log(`Running allocation for order ${orderId}`);

    try {
      const allocations = await this.allocationService.softAllocate(orderId, tenantId);
      this.logger.log(`Soft allocated ${allocations.length} lines for order ${orderId}`);

      if (job.data.hardAllocate) {
        await this.allocationService.hardAllocate(orderId, tenantId);
        this.logger.log(`Hard allocated order ${orderId}`);
      }
      return { orderId, allocations: allocations.length };
    } catch (err: any) {
      this.logger.error(`Allocation failed for order ${orderId}: ${err.message}`);
      throw err;
    }
  }
}
