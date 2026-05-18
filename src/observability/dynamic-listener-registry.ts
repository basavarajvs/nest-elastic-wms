import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ListenerRegistration {
  event: string;
  listener: (...args: any[]) => void;
  source: string;
  registeredAt: number;
  cleanupCyclesMissed: number;
}

@Injectable()
export class DynamicListenerRegistry {
  private readonly logger = new Logger(DynamicListenerRegistry.name);
  private registrations = new Map<string, ListenerRegistration>();
  private cleanupCount = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  register(source: string, event: string, listener: (...args: any[]) => void): void {
    const key = `${source}:${event}`;
    this.registrations.set(key, {
      event,
      listener,
      source,
      registeredAt: Date.now(),
      cleanupCyclesMissed: 0,
    });
    this.eventEmitter.on(event, listener);
  }

  unregister(source: string, event: string): void {
    const key = `${source}:${event}`;
    const reg = this.registrations.get(key);
    if (reg) {
      this.eventEmitter.off(event, reg.listener);
      this.registrations.delete(key);
    }
  }

  getOrphanedListeners(): Array<{ event: string; source: string; cyclesMissed: number }> {
    const orphaned: Array<{ event: string; source: string; cyclesMissed: number }> = [];
    for (const [key, reg] of this.registrations.entries()) {
      const count = this.eventEmitter.listenerCount(reg.event);
      const expected = this.registrations.size;

      if (count === 0 || expected === 0) {
        orphaned.push({
          event: reg.event,
          source: reg.source,
          cyclesMissed: reg.cleanupCyclesMissed,
        });
      }
    }
    return orphaned;
  }

  markCleanupCycle(): void {
    this.cleanupCount++;
    for (const [key, reg] of this.registrations.entries()) {
      const count = this.eventEmitter.listenerCount(reg.event);
      if (count === 0) {
        reg.cleanupCyclesMissed++;
        if (reg.cleanupCyclesMissed >= 3) {
          this.logger.warn(`Removing orphaned listener: ${key} (missed ${reg.cleanupCyclesMissed} cycles)`);
          this.registrations.delete(key);
        }
      }
    }
  }

  getExpectedEventCounts(): Array<{ event: string; count: number }> {
    const counts = new Map<string, number>();
    for (const reg of this.registrations.values()) {
      counts.set(reg.event, (counts.get(reg.event) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([event, count]) => ({ event, count }));
  }
}
