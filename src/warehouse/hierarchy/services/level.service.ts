import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LevelService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, rackId?: string) {
    const where: any = { tenantId };
    if (rackId) where.rackId = rackId;
    return (this.prisma as any).level.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, tenantId: string) {
    const level = await (this.prisma as any).level.findFirst({
      where: { id, tenantId },
    });
    if (!level) throw new NotFoundException('Level not found');
    return level;
  }

  async create(tenantId: string, facilityId: string, zoneId: string, aisleId: string, bayId: string, rackId: string, levelCode: string, name?: string) {
    const existing = await (this.prisma as any).level.findFirst({
      where: { tenantId, facilityId, zoneId, rackId, levelCode },
    });
    if (existing) throw new BadRequestException(`Level ${levelCode} already exists in this rack`);
    return (this.prisma as any).level.create({
      data: { tenantId, facilityId, zoneId, aisleId, bayId, rackId, levelCode, name },
    });
  }

  async update(id: string, tenantId: string, data: { levelCode?: string; name?: string; isActive?: boolean }) {
    const level = await (this.prisma as any).level.findFirst({ where: { id, tenantId } });
    if (!level) throw new NotFoundException('Level not found');
    return (this.prisma as any).level.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const level = await (this.prisma as any).level.findFirst({ where: { id, tenantId } });
    if (!level) throw new NotFoundException('Level not found');
    return (this.prisma as any).level.delete({ where: { id } });
  }
}
