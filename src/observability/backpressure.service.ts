import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const CONSUMER_LAG_THRESHOLD = 500;
const DRAIN_THRESHOLD = 0.5;

@Injectable()
export class BackpressureService {
  private readonly logger = new Logger(BackpressureService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  createBackpressuredReader(source: AsyncGenerator<any>, label: string): AsyncGenerator<any> {
    const self = this;
    let paused = false;
    let lastConsumerLag = 0;

    return (async function* () {
      for await (const chunk of source) {
        if (paused) {
          await new Promise((r) => setTimeout(r, 100));
          paused = false;
        }
        yield chunk;
      }
    })();

    // Note: Stream backpressure is typically handled at the Node.js stream level
    // via highWaterMark and push() behavior. This service provides monitoring.
  }

  checkLag(startTime: number, label: string): boolean {
    const lag = Date.now() - startTime;
    if (lag > CONSUMER_LAG_THRESHOLD) {
      this.logger.warn(`Stream backpressure active for ${label}: lag=${lag}ms`);
      this.eventEmitter.emit('stream.backpressure.active', { label, lagMs: lag });
      return true;
    }
    return false;
  }
}
