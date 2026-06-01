import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RackService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, bayId?: string) {
    const where: any = { tenantId };
    if (bayId) where.bayId = bayId;
    return (this.prisma as any).rack.findMany({
      where,
      include: { _count: { select: { levels: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, tenantId: string) {
    const rack = await (this.prisma as any).rack.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { levels: true } } },
    });
    if (!rack) throw new NotFoundException('Rack not found');
    return rack;
  }

  async create(tenantId: string, facilityId: string, zoneId: string, aisleId: string, bayId: string, rackCode: string, name?: string) {
    const existing = await (this.prisma as any).rack.findFirst({
      where: { tenantId, facilityId, zoneId, bayId, rackCode },
    });
    if (existing) throw new BadRequestException(`Rack ${rackCode} already exists in this bay`);
    return (this.prisma as any).rack.create({
      data: { tenantId, facilityId, zoneId, aisleId, bayId, rackCode, name },
    });
  }

  async update(id: string, tenantId: string, data: { rackCode?: string; name?: string; isActive?: boolean }) {
    const rack = await (this.prisma as any).rack.findFirst({ where: { id, tenantId } });
    if (!rack) throw new NotFoundException('Rack not found');
    return (this.prisma as any).rack.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const rack = await (this.prisma as any).rack.findFirst({ where: { id, tenantId } });
    if (!rack) throw new NotFoundException('Rack not found');
    const levelCount = await (this.prisma as any).level.count({ where: { rackId: id } });
    if (levelCount > 0) throw new BadRequestException(`Cannot delete rack with ${levelCount} level(s)`);
    return (this.prisma as any).rack.delete({ where: { id } });
  }
}
