import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacilityAccessService {
  private readonly logger = new Logger(FacilityAccessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.facility_access_control.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        user_id: dto.user_id,
        role_in_facility: dto.role_in_facility,
        permissions_json: dto.permissions_json,
        is_active: dto.is_active ?? true,
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
      this.prisma.facility_access_control.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { access_id: 'desc' },
      }),
      this.prisma.facility_access_control.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, accessId: bigint) {
    const record = await this.prisma.facility_access_control.findFirst({
      where: { tenant_id: tenantId, access_id: accessId },
    });
    if (!record) throw new NotFoundException('Facility access control record not found');
    return record;
  }

  async update(tenantId: string, accessId: bigint, dto: any) {
    await this.findById(tenantId, accessId);
    await this.prisma.facility_access_control.updateMany({
      where: { tenant_id: tenantId, access_id: accessId },
      data: {
        role_in_facility: dto.role_in_facility,
        permissions_json: dto.permissions_json,
        is_active: dto.is_active,
      },
    });
    return this.findById(tenantId, accessId);
  }

  async delete(tenantId: string, accessId: bigint) {
    const record = await this.findById(tenantId, accessId);
    await this.prisma.facility_access_control.deleteMany({
      where: { tenant_id: tenantId, access_id: accessId },
    });
    return record;
  }
}
