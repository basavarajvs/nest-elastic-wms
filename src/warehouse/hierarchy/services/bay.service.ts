import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BayService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, aisleId?: string) {
    const where: any = { tenantId };
    if (aisleId) where.aisleId = aisleId;
    return (this.prisma as any).bay.findMany({
      where,
      include: { _count: { select: { racks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, tenantId: string) {
    const bay = await (this.prisma as any).bay.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { racks: true } } },
    });
    if (!bay) throw new NotFoundException('Bay not found');
    return bay;
  }

  async create(tenantId: string, facilityId: string, zoneId: string, aisleId: string, bayCode: string, name?: string) {
    const existing = await (this.prisma as any).bay.findFirst({
      where: { tenantId, facilityId, zoneId, aisleId, bayCode },
    });
    if (existing) throw new BadRequestException(`Bay ${bayCode} already exists in this aisle`);
    return (this.prisma as any).bay.create({
      data: { tenantId, facilityId, zoneId, aisleId, bayCode, name },
    });
  }

  async update(id: string, tenantId: string, data: { bayCode?: string; name?: string; isActive?: boolean }) {
    const bay = await (this.prisma as any).bay.findFirst({ where: { id, tenantId } });
    if (!bay) throw new NotFoundException('Bay not found');
    return (this.prisma as any).bay.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const bay = await (this.prisma as any).bay.findFirst({ where: { id, tenantId } });
    if (!bay) throw new NotFoundException('Bay not found');
    const rackCount = await (this.prisma as any).rack.count({ where: { bayId: id } });
    if (rackCount > 0) throw new BadRequestException(`Cannot delete bay with ${rackCount} rack(s)`);
    return (this.prisma as any).bay.delete({ where: { id } });
  }
}
