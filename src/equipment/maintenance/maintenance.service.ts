import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: any) {
    const equipment = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: BigInt(dto.equipmentId), is_deleted: false },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    return this.prisma.equipment_maintenance.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        equipment_id: BigInt(dto.equipmentId),
        maintenance_type: dto.maintenanceType,
        maintenance_date: new Date(dto.maintenanceDate || new Date()),
        next_maintenance_date: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        performed_by_user_id: dto.performedByUserId,
        technician_name: dto.technicianName,
        maintenance_cost: dto.maintenanceCost,
        description: dto.description,
        duration_minutes: dto.durationMinutes,
        status: dto.status || 'SCHEDULED',
        notes: dto.notes,
        created_by: userId,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.equipmentId) where.equipment_id = BigInt(query.equipmentId);
    if (query.status) where.status = query.status;
    if (query.maintenanceType) where.maintenance_type = query.maintenanceType;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.equipment_maintenance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { maintenance_date: 'desc' },
      }),
      this.prisma.equipment_maintenance.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, maintenanceId: bigint) {
    const record = await this.prisma.equipment_maintenance.findFirst({
      where: { tenant_id: tenantId, maintenance_id: maintenanceId },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return record;
  }

  async complete(tenantId: string, userId: string, maintenanceId: bigint, dto: any) {
    const record = await this.findById(tenantId, maintenanceId);
    if (record.status === 'COMPLETED') {
      throw new BadRequestException('Maintenance already completed');
    }

    const now = new Date();
    const result = await this.prisma.equipment_maintenance.update({
      where: { maintenance_id: maintenanceId },
      data: {
        status: 'COMPLETED',
        maintenance_cost: dto.maintenanceCost,
        duration_minutes: dto.durationMinutes,
        notes: dto.notes,
        performed_by_user_id: dto.performedByUserId || userId,
        technician_name: dto.technicianName,
        next_maintenance_date: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : undefined,
        updated_by: userId,
      },
    });

    const equipment = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: record.equipment_id },
    });
    if (equipment && equipment.status === 'MAINTENANCE') {
      await this.prisma.warehouse_equipment.update({
        where: { equipment_id: record.equipment_id },
        data: {
          status: 'AVAILABLE',
          last_maintenance_date: now,
          next_maintenance_date: result.next_maintenance_date || equipment.next_maintenance_date,
          updated_by: userId,
        },
      });
    }

    return result;
  }

  async delete(tenantId: string, maintenanceId: bigint) {
    return this.prisma.equipment_maintenance.deleteMany({
      where: { tenant_id: tenantId, maintenance_id: maintenanceId },
    });
  }
}
