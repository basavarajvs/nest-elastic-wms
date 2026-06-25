import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dtos/labor.dto';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createShift(dto: CreateShiftDto, tenantId: string): Promise<any> {
    return this.prisma.laborShift.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        shiftCode: dto.shiftCode,
        shiftName: dto.shiftName,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone ?? 'UTC',
      },
    });
  }

  async listShifts(tenantId: string, filters?: { facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    return this.prisma.laborShift.findMany({ where, orderBy: { shiftCode: 'asc' } });
  }

  async updateShift(id: string, dto: UpdateShiftDto, tenantId: string): Promise<any> {
    const shift = await this.prisma.laborShift.findFirst({ where: { id, tenantId } });
    if (!shift) throw new NotFoundException('Labor shift not found');
    return this.prisma.laborShift.update({ where: { id }, data: dto });
  }

  async assignShift(dto: AssignShiftDto, tenantId: string): Promise<any> {
    const shift = await this.prisma.laborShift.findFirst({ where: { id: dto.shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Labor shift not found');
    return this.prisma.laborShiftAssignment.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        shiftId: dto.shiftId,
        userId: dto.userId,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });
  }

  async listAssignments(tenantId: string, filters?: { userId?: string; shiftId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.shiftId) where.shiftId = filters.shiftId;
    return this.prisma.laborShiftAssignment.findMany({
      where,
      include: { shift: true },
      orderBy: { effectiveDate: 'desc' },
    });
  }
}
