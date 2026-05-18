import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ZoneCapacityValidator {
  private readonly logger = new Logger(ZoneCapacityValidator.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateLocation(locationId: string, tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    const location = await (this.prisma as any).storageLocation.findFirst({
      where: { id: locationId, tenantId },
      include: { zone: true },
    });
    if (!location) return { allowed: false, reason: 'Location not found' };

    return { allowed: true };
  }
}
