import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ListenerBaseline {
  event: string;
  expectedCount: number;
  source: string;
}

@Injectable()
export class EventLeakDetectorService {
  private readonly logger = new Logger(EventLeakDetectorService.name);
  private baseline: ListenerBaseline[] = [];
  private baselineSet = false;
  private readonly LEAK_THRESHOLD_PCT = 20;
  private readonly CLEANUP_CYCLES = 3;
  private dynamicPatterns = [
    /^xstate\./,
    /^jdm\./,
    /^bpmn\./,
    /^rule\./,
    /^workflow\./,
  ];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  recordBaseline(baselines: ListenerBaseline[]): void {
    this.baseline = baselines;
    this.baselineSet = true;
  }

  isDynamicEvent(event: string): boolean {
    return this.dynamicPatterns.some((p) => p.test(event));
  }

  @Cron('*/5 * * * *')
  async checkForLeaks() {
    if (!this.baselineSet) return;

    const listeners = (this.eventEmitter as any).eventNames() as string[];
    const topListeners: Array<{ event: string; count: number }> = [];

    for (const event of listeners) {
      if (this.isDynamicEvent(event)) continue;

      const count = this.eventEmitter.listenerCount(event);
      const expected = this.baseline.find((b) => b.event === event);

      if (expected && count > expected.expectedCount) {
        const growthPct = ((count - expected.expectedCount) / expected.expectedCount) * 100;
        if (growthPct > this.LEAK_THRESHOLD_PCT) {
          topListeners.push({ event, count });
        }
      }
    }

    const sorted = topListeners.sort((a, b) => b.count - a.count).slice(0, 10);

    if (sorted.length > 0) {
      this.logger.error(`Event listener leak detected: top ${sorted.length} suspicious listeners`);
      for (const l of sorted) {
        this.logger.warn(`  ${l.event}: ${l.count} listeners`);
      }
      this.eventEmitter.emit('event.leak.detected', { topListeners: sorted });
    }
  }
}
