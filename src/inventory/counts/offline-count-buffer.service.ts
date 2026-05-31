import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface OfflineCountEntry {
  lineId: string;
  countedQuantity: number;
  clientTimestamp: number;
  deviceId: string;
}

@Injectable()
export class OfflineCountBuffer {
  private readonly logger = new Logger(OfflineCountBuffer.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncOffline(entries: OfflineCountEntry[], tenantId: string): Promise<{ synced: number; conflicts: number }> {
    let synced = 0;
    let conflicts = 0;

    for (const entry of entries) {
      try {
        const line = await (this.prisma as any).cycleCountLine.findFirst({
          where: { id: entry.lineId, tenantId },
        });
        if (!line) {
          conflicts++;
          continue;
        }

        if (line.status !== 'PENDING') {
          const existingTime = new Date(line.countedAt || 0).getTime();
          if (entry.clientTimestamp < existingTime) {
            this.logger.warn(`Offline entry rejected (server authoritative): line=${entry.lineId}`);
            conflicts++;
            continue;
          }
        }

        const variance = entry.countedQuantity - line.systemQuantity;
        await (this.prisma as any).cycleCountLine.update({
          where: { id: entry.lineId },
          data: {
            countedQuantity: entry.countedQuantity,
            varianceQuantity: variance,
            status: 'COUNTED',
            countedAt: new Date(entry.clientTimestamp),
          },
        });
        synced++;
      } catch (err: any) {
        this.logger.error(`Offline sync failed for line ${entry.lineId}: ${err.message}`);
        conflicts++;
      }
    }

    return { synced, conflicts };
  }
}
