import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClockInDto, ClockOutDto, ListTimeLogsDto } from './dtos/labor.dto';

@Injectable()
export class TimeTrackingService {
  private readonly logger = new Logger(TimeTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async clockIn(dto: ClockInDto, userId: string, tenantId: string): Promise<any> {
    const active = await this.prisma.laborTimeLog.findFirst({
      where: { tenantId, userId, status: 'ACTIVE' },
    });
    if (active) throw new BadRequestException('User already has an active time log');

    return this.prisma.laborTimeLog.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        userId,
        shiftId: dto.shiftId ?? undefined,
        clockIn: new Date(),
        notes: dto.notes ?? undefined,
      },
    });
  }

  async clockOut(dto: ClockOutDto, userId: string, tenantId: string): Promise<any> {
    const log = await this.prisma.laborTimeLog.findFirst({
      where: { id: dto.timeLogId, tenantId, userId, status: 'ACTIVE' },
    });
    if (!log) throw new BadRequestException('No active time log found');

    const clockOut = new Date();
    const totalMs = clockOut.getTime() - log.clockIn.getTime();
    const totalMinutes = Math.floor(totalMs / 60000) - (dto.breakDuration ?? 0);
    const overtimeMinutes = Math.max(0, totalMinutes - 480); // 8h standard

    return this.prisma.laborTimeLog.update({
      where: { id: dto.timeLogId },
      data: {
        clockOut,
        breakDuration: dto.breakDuration ?? 0,
        totalMinutes,
        overtimeMinutes,
        status: 'COMPLETED',
        notes: dto.notes ?? undefined,
      },
    });
  }

  async listTimeLogs(tenantId: string, filters: ListTimeLogsDto): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.date) {
      const d = new Date(filters.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.clockIn = { gte: d, lt: next };
    }
    return this.prisma.laborTimeLog.findMany({ where, orderBy: { clockIn: 'desc' } });
  }
}
