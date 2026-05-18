import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationCodeRefactorService {
  private readonly logger = new Logger(LocationCodeRefactorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async migrateCode(
    tenantId: string,
    facilityId: string,
    oldPrefix: string,
    newPrefix: string,
  ): Promise<number> {
    const locations = await (this.prisma as any).storageLocation.findMany({
      where: {
        tenantId,
        facilityId,
        locationCode: { startsWith: oldPrefix },
      },
    });

    if (locations.length === 0) return 0;

    return this.prisma.withTransaction(tenantId, async (tx: any) => {
      let updatedCount = 0;
      for (const loc of locations) {
        const newCode = loc.locationCode.replace(
          new RegExp(`^${oldPrefix}`),
          newPrefix,
        );
        if (newCode === loc.locationCode) continue;

        const existing = await tx.storageLocation.findFirst({
          where: { tenantId, facilityId, locationCode: newCode },
        });
        if (existing) {
          this.logger.warn(
            `Skipping ${loc.locationCode} \u2192 ${newCode}: target exists`,
          );
          continue;
        }

        await tx.storageLocation.update({
          where: { id: loc.id },
          data: { locationCode: newCode },
        });
        updatedCount++;
      }

      if (updatedCount > 0) {
        this.eventEmitter.emit('location.code.migrated', {
          tenantId,
          facilityId,
          oldPrefix,
          newPrefix,
          count: updatedCount,
        });

        this.logger.log(
          `Migrated ${updatedCount}/${locations.length} location codes: ${oldPrefix}* \u2192 ${newPrefix}*`,
        );
      }

      return updatedCount;
    });
  }
}
