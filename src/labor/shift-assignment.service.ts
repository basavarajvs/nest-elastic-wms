import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftAssignmentService {
  private readonly logger = new Logger(ShiftAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.labor_shift_assignments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        shift_id: BigInt(dto.shift_id),
        user_id: dto.user_id,
        assignment_date: new Date(dto.assignment_date),
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_end_time: dto.scheduled_end_time,
        status: dto.status ?? 'SCHEDULED',
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
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

  async findById(tenantId: string, assignmentId: bigint) {
    const record = await this.prisma.labor_shift_assignments.findFirst({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    if (!record) throw new NotFoundException('Shift assignment not found');
    return record;
  }

  async update(tenantId: string, assignmentId: bigint, dto: any) {
    await this.findById(tenantId, assignmentId);
    await this.prisma.labor_shift_assignments.updateMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
      data: {
        scheduled_start_time: dto.scheduled_start_time,
        scheduled_end_time: dto.scheduled_end_time,
        status: dto.status,
        notes: dto.notes,
      },
    });
    return this.findById(tenantId, assignmentId);
  }

  async delete(tenantId: string, assignmentId: bigint) {
    const record = await this.findById(tenantId, assignmentId);
    await this.prisma.labor_shift_assignments.deleteMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    return record;
  }
}
