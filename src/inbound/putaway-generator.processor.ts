import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PutawayService } from './putaway.service';

@Processor('putaway-generator')
export class PutawayGeneratorProcessor extends WorkerHost {
  private readonly logger = new Logger(PutawayGeneratorProcessor.name);
  private static lastRun = new Map<string, number>();

  constructor(private readonly putawayService: PutawayService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { grnId, tenantId } = job.data;
    this.logger.log(`Processing putaway generation for GRN ${grnId}`);

    const now = Date.now();
    const lastRun = PutawayGeneratorProcessor.lastRun.get(grnId) || 0;
    if (now - lastRun < 5000) {
      this.logger.log(`Debouncing GRN ${grnId} (last run ${now - lastRun}ms ago)`);
      return { debounced: true, grnId };
    }
    PutawayGeneratorProcessor.lastRun.set(grnId, now);

    try {
      const tasks = await this.putawayService.generateTasks(grnId, tenantId);
      this.logger.log(`Generated ${tasks.length} putaway tasks for GRN ${grnId}`);
      return { tasksGenerated: tasks.length, grnId };
    } catch (err: any) {
      this.logger.error(`Putaway generation failed for GRN ${grnId}: ${err.message}`);
      throw err;
    }
  }
}
