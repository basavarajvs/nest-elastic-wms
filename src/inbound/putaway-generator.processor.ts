import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { PutawayService } from './putaway.service';

@Processor('putaway-generator')
export class PutawayGeneratorProcessor extends WorkerHost {
  private readonly logger = new Logger(PutawayGeneratorProcessor.name);

  constructor(
    private readonly putawayService: PutawayService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { grnId, tenantId } = job.data;
    this.logger.log(`Processing putaway generation for GRN ${grnId}`);

    const lockKey = `putaway:gen:${grnId}`;
    const lock = await this.redis.set(lockKey, 'LOCK', 'EX', 10, 'NX');
    if (!lock) {
      this.logger.log(`Debouncing GRN ${grnId} (already being processed)`);
      return { debounced: true, grnId };
    }

    try {
      const tasks = await this.putawayService.generateTasks(grnId, tenantId);
      this.logger.log(`Generated ${tasks.length} putaway tasks for GRN ${grnId}`);
      return { tasksGenerated: tasks.length, grnId };
    } catch (err: any) {
      this.logger.error(`Putaway generation failed for GRN ${grnId}: ${err.message}`);
      throw err;
    } finally {
      await this.redis.del(lockKey).catch(() => {});
    }
  }
}
