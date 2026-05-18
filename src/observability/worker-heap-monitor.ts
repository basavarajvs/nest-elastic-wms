import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const HEAP_WARNING_MB = parseInt(process.env.HEAP_WARNING_THRESHOLD_MB || '1200', 10);

@Injectable()
export class WorkerHeapMonitor {
  private readonly logger = new Logger(WorkerHeapMonitor.name);
  private isPaused = false;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  checkMemory(queueName: string, jobId?: string): boolean {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    if (heapUsedMB > HEAP_WARNING_MB) {
      this.logger.error(
        `Memory pressure: ${queueName} job=${jobId || '?'} heap=${heapUsedMB}MB/${heapTotalMB}MB rss=${rssMB}MB`,
      );
      this.eventEmitter.emit('worker.memory.pressure', {
        queueName,
        jobId,
        heapUsedMB,
        heapTotalMB,
        rssMB,
      });

      if (!this.isPaused) {
        this.isPaused = true;
        this.logger.warn('Pausing worker for GC...');
        global.gc?.();
        setTimeout(() => {
          this.isPaused = false;
          this.logger.log('Worker resumed after GC');
        }, 500);
      }

      return true;
    }

    return false;
  }

  isWorkerPaused(): boolean {
    return this.isPaused;
  }
}
