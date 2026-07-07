import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: any) {
    const existing = await this.prisma.labor_shifts.findFirst({
      where: { tenant_id: tenantId, facility_id: BigInt(dto.facility_id), shift_code: dto.shift_code },
    });
    if (existing) {
      throw new BadRequestException('Shift code already exists for this facility');
    }

    const created = await this.prisma.labor_shifts.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        shift_name: dto.shift_name,
        shift_code: dto.shift_code,
        description: dto.description,
        start_time: dto.start_time,
        end_time: dto.end_time,
        break_duration_minutes: dto.break_duration_minutes ?? 0,
        scheduled_days_json: dto.scheduled_days_json ? JSON.stringify(dto.scheduled_days_json) : null,
        is_active: dto.is_active ?? true,
        created_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf, ...restCreate } = created;
    return { ...restCreate, facility_name: wf?.facility_name ?? null };
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { shift_name: { contains: query.search, mode: 'insensitive' } },
        { shift_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rawData, total] = await Promise.all([
      this.prisma.labor_shifts.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { shift_code: 'asc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.labor_shifts.count({ where }),
    ]);
    const data = rawData.map(({ warehouse_facilities, ...rest }) => ({
      ...rest,
      facility_name: warehouse_facilities?.facility_name ?? null,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, shiftId: bigint) {
    const shift = await this.prisma.labor_shifts.findFirst({
      where: { tenant_id: tenantId, shift_id: shiftId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    const { warehouse_facilities, ...rest } = shift;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
  }

  async update(tenantId: string, userId: string, shiftId: bigint, dto: any) {
    const shift = await this.findById(tenantId, shiftId);

    if (dto.shift_code && dto.shift_code !== shift.shift_code) {
      const existing = await this.prisma.labor_shifts.findFirst({
        where: {
          tenant_id: tenantId,
          facility_id: shift.facility_id,
          shift_code: dto.shift_code,
          shift_id: { not: shiftId },
        },
      });
      if (existing) throw new BadRequestException('Shift code already exists');
    }

    const updated = await this.prisma.labor_shifts.update({
      where: { shift_id: shiftId },
      data: {
        shift_name: dto.shift_name,
        shift_code: dto.shift_code,
        description: dto.description,
        start_time: dto.start_time,
        end_time: dto.end_time,
        break_duration_minutes: dto.break_duration_minutes,
        scheduled_days_json: dto.scheduled_days_json ? JSON.stringify(dto.scheduled_days_json) : undefined,
        is_active: dto.is_active,
        updated_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf2, ...restUpdate } = updated;
    return { ...restUpdate, facility_name: wf2?.facility_name ?? null };
  }

  async delete(tenantId: string, shiftId: bigint) {
    await this.findById(tenantId, shiftId);

    const assignmentCount = await this.prisma.labor_shift_assignments.count({
      where: { tenant_id: tenantId, shift_id: shiftId },
    });
    if (assignmentCount > 0) {
      throw new BadRequestException('Cannot delete shift with active assignments');
    }

    const deleted = await this.prisma.labor_shifts.delete({
      where: { shift_id: shiftId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf3, ...restDel } = deleted;
    return { ...restDel, facility_name: wf3?.facility_name ?? null };
  }

  async createAssignment(tenantId: string, userId: string, dto: any) {
    await this.findById(tenantId, BigInt(dto.shiftId));

    const conflict = await this.prisma.labor_shift_assignments.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        user_id: dto.userId,
        assignment_date: new Date(dto.assignmentDate),
      },
    });
    if (conflict) {
      throw new BadRequestException('User already has an assignment for this date');
    }

    return this.prisma.labor_shift_assignments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        shift_id: BigInt(dto.shiftId),
        user_id: dto.userId,
        assignment_date: new Date(dto.assignmentDate),
        scheduled_start_time: dto.scheduledStartTime,
        scheduled_end_time: dto.scheduledEndTime,
        status: dto.status || 'SCHEDULED',
        notes: dto.notes,
        created_by: userId,
      },
    });
  }

  async findAssignments(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.shiftId) where.shift_id = BigInt(query.shiftId);
    if (query.userId) where.user_id = query.userId;
    if (query.assignmentDate) where.assignment_date = new Date(query.assignmentDate);
    if (query.status) where.status = query.status;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.labor_shift_assignments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignment_date: 'desc' },
      }),
      this.prisma.labor_shift_assignments.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
