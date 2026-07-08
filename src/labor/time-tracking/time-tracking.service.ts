import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TimeTrackingService {
  private readonly logger = new Logger(TimeTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async clockIn(tenantId: string, userId: string, dto: any) {
    const activeLog = await this.prisma.labor_time_logs.findFirst({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: 'CLOCKED_IN',
      },
    });
    if (activeLog) {
      throw new BadRequestException('User already clocked in');
    }

    const facilityId = dto.facilityId
      ? BigInt(dto.facilityId)
      : (await this.getUserDefaultFacility(tenantId, userId));

    return this.prisma.labor_time_logs.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        assignment_id: dto.assignmentId ? BigInt(dto.assignmentId) : null,
        user_id: userId,
        date_worked: new Date(),
        clock_in_time: new Date(),
        status: 'CLOCKED_IN',
        notes: dto.notes,
        created_by: userId,
      },
    });
  }

  async clockOut(tenantId: string, userId: string, dto: any) {
    const activeLog = await this.prisma.labor_time_logs.findFirst({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: 'CLOCKED_IN',
      },
    });
    if (!activeLog) {
      throw new BadRequestException('No active clock-in found');
    }

    const now = new Date();
    const clockIn = new Date(activeLog.clock_in_time);
    const workedMs = now.getTime() - clockIn.getTime();
    const totalWorkedMinutes = Math.floor(workedMs / 60000);

    const breakStart = activeLog.break_start_time
      ? new Date(activeLog.break_start_time).getTime()
      : null;
    const breakEnd = activeLog.break_end_time
      ? new Date(activeLog.break_end_time).getTime()
      : null;
    const breakMinutes = breakStart && breakEnd
      ? Math.floor((breakEnd - breakStart) / 60000)
      : 0;
    const netMinutes = totalWorkedMinutes - breakMinutes;

    return this.prisma.labor_time_logs.update({
      where: { time_log_id: activeLog.time_log_id },
      data: {
        clock_out_time: now,
        total_worked_minutes: totalWorkedMinutes,
        total_break_minutes: breakMinutes,
        net_worked_minutes: netMinutes,
        status: 'CLOCKED_OUT',
        notes: dto.notes,
        updated_by: userId,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.userId) where.user_id = query.userId;
    if (query.status) where.status = query.status;
    if (query.dateFrom) where.clock_in_time = { ...where.clock_in_time, gte: new Date(query.dateFrom) };
    if (query.dateTo) where.clock_in_time = { ...where.clock_in_time, lte: new Date(query.dateTo) };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rawData, total] = await Promise.all([
      this.prisma.labor_time_logs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { clock_in_time: 'desc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.labor_time_logs.count({ where }),
    ]);
    const data = rawData.map(({ warehouse_facilities, ...rest }) => ({
      ...rest,
      facility_name: warehouse_facilities?.facility_name ?? null,
    }));
    return { data, total, page, limit };
  }

  async delete(tenantId: string, logId: bigint) {
    const record = await this.prisma.labor_time_logs.findFirst({
      where: { tenant_id: tenantId, time_log_id: logId },
    });
    await this.prisma.labor_time_logs.deleteMany({
      where: { tenant_id: tenantId, time_log_id: logId },
    });
    return record;
  }

  private async getUserDefaultFacility(tenantId: string, userId: string): Promise<bigint> {
    const assignment = await this.prisma.labor_shift_assignments.findFirst({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: 'SCHEDULED',
        assignment_date: new Date(),
      },
      orderBy: { created_at: 'desc' },
    });
    if (assignment) return assignment.facility_id;

    const lastLog = await this.prisma.labor_time_logs.findFirst({
      where: { tenant_id: tenantId, user_id: userId },
      orderBy: { clock_in_time: 'desc' },
    });
    if (lastLog) return lastLog.facility_id;

    throw new BadRequestException('No facility context found. Please provide facilityId.');
  }
}
