import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createGzip, gunzipSync, gzipSync } from 'zlib';

const RING_SIZE = 50;
const MAX_RAW_BYTES = 256 * 1024; // 256 KB

/**
 * Challenge 5: StateMachineContextTrimmer
 * Maintains fixed-size ring buffer (last 50 transitions) in contextJson,
 * streams older events to Core AuditService, and compresses payloads.
 */
@Injectable()
export class ContextTrimmerService {
  private readonly logger = new Logger(ContextTrimmerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async trimAndArchive(instanceId: string, newContext: Record<string, any>, tenantId: string) {
    const auditLog = Array.isArray(newContext.auditLog) ? newContext.auditLog : [];

    if (auditLog.length > RING_SIZE) {
      const toArchive = auditLog.slice(0, auditLog.length - RING_SIZE);
      const ringBuffer = auditLog.slice(-RING_SIZE);

      for (const entry of toArchive) {
        this.eventEmitter.emit('wms.audit.log', {
          source: 'statemachine',
          instanceId,
          entry,
          tenantId,
          timestamp: new Date(),
        });
      }

      newContext.auditLog = ringBuffer;
    }

    const raw = Buffer.from(JSON.stringify(newContext));
    if (raw.length > MAX_RAW_BYTES) {
      const compressed = gzipSync(raw).toString('base64');
      newContext.__compressed = true;
      newContext.__payload = compressed;
      return { contextJson: newContext, compressedPayload: compressed };
    }

    return { contextJson: newContext };
  }

  decompressInstance(instance: any): Record<string, any> {
    const ctx = instance?.contextJson as Record<string, any> | null;
    if (!ctx || !ctx.__compressed) return ctx || {};
    try {
      const decompressed = gunzipSync(Buffer.from(ctx.__payload, 'base64'));
      const restored = JSON.parse(decompressed.toString());
      return { ...restored, __decompressed: true };
    } catch {
      this.logger.warn(`Failed to decompress context for instance ${instance?.id}`);
      return ctx;
    }
  }
}
