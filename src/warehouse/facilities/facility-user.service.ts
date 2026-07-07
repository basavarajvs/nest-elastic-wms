import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacilityUserService {
  private readonly logger = new Logger(FacilityUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.facility_user_assignments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        user_id: dto.user_id,
        user_email: dto.user_email,
        user_name: dto.user_name,
        is_active: dto.is_active ?? true,
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.userId) where.user_id = query.userId;
    if (query.isActive !== undefined) where.is_active = query.isActive;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.facility_user_assignments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assigned_at: 'desc' },
      }),
      this.prisma.facility_user_assignments.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, assignmentId: bigint) {
    const record = await this.prisma.facility_user_assignments.findFirst({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    if (!record) throw new NotFoundException('Facility user assignment not found');
    return record;
  }

  async update(tenantId: string, assignmentId: bigint, dto: any) {
    await this.findById(tenantId, assignmentId);
    await this.prisma.facility_user_assignments.updateMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
      data: {
        user_email: dto.user_email,
        user_name: dto.user_name,
        is_active: dto.is_active,
        notes: dto.notes,
      },
    });
    return this.findById(tenantId, assignmentId);
  }

  async delete(tenantId: string, assignmentId: bigint) {
    const record = await this.findById(tenantId, assignmentId);
    await this.prisma.facility_user_assignments.deleteMany({
      where: { tenant_id: tenantId, assignment_id: assignmentId },
    });
    return record;
  }
}
