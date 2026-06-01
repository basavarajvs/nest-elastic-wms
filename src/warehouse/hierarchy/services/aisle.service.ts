import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AisleService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, zoneId?: string) {
    const where: any = { tenantId };
    if (zoneId) where.zoneId = zoneId;
    return (this.prisma as any).aisle.findMany({
      where,
      include: { _count: { select: { bays: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, tenantId: string) {
    const aisle = await (this.prisma as any).aisle.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { bays: true } } },
    });
    if (!aisle) throw new NotFoundException('Aisle not found');
    return aisle;
  }

  async create(tenantId: string, facilityId: string, zoneId: string, aisleCode: string, name?: string) {
    const existing = await (this.prisma as any).aisle.findFirst({
      where: { tenantId, facilityId, zoneId, aisleCode },
    });
    if (existing) throw new BadRequestException(`Aisle ${aisleCode} already exists in this zone`);
    return (this.prisma as any).aisle.create({
      data: { tenantId, facilityId, zoneId, aisleCode, name },
    });
  }

  async update(id: string, tenantId: string, data: { aisleCode?: string; name?: string; isActive?: boolean }) {
    const aisle = await (this.prisma as any).aisle.findFirst({ where: { id, tenantId } });
    if (!aisle) throw new NotFoundException('Aisle not found');
    return (this.prisma as any).aisle.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const aisle = await (this.prisma as any).aisle.findFirst({ where: { id, tenantId } });
    if (!aisle) throw new NotFoundException('Aisle not found');
    const bayCount = await (this.prisma as any).bay.count({ where: { aisleId: id } });
    if (bayCount > 0) throw new BadRequestException(`Cannot delete aisle with ${bayCount} bay(s)`);
    return (this.prisma as any).aisle.delete({ where: { id } });
  }
}
