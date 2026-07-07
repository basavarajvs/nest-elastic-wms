import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: any) {
    const equipment = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: BigInt(dto.equipment_id), is_deleted: false },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const created = await this.prisma.equipment_maintenance.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        equipment_id: BigInt(dto.equipment_id),
        maintenance_type: dto.maintenance_type,
        maintenance_date: new Date(dto.maintenance_date || new Date()),
        next_maintenance_date: dto.next_maintenance_date ? new Date(dto.next_maintenance_date) : null,
        performed_by_user_id: dto.performed_by_user_id,
        technician_name: dto.technician_name,
        maintenance_cost: dto.maintenance_cost,
        description: dto.description,
        duration_minutes: dto.duration_minutes,
        status: dto.status || 'SCHEDULED',
        notes: dto.notes,
        created_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf, ...restCreate } = created;
    return { ...restCreate, facility_name: wf?.facility_name ?? null, equipment_name: equipment.equipment_name };
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.equipmentId) where.equipment_id = BigInt(query.equipmentId);
    if (query.status) where.status = query.status;
    if (query.maintenanceType) where.maintenance_type = query.maintenanceType;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rawData, total] = await Promise.all([
      this.prisma.equipment_maintenance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { maintenance_date: 'desc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.equipment_maintenance.count({ where }),
    ]);
    const equipmentIds = [...new Set(rawData.map(r => r.equipment_id))];
    const equipmentMap = new Map(
      equipmentIds.length > 0
        ? (await this.prisma.warehouse_equipment.findMany({
            where: { tenant_id: tenantId, equipment_id: { in: equipmentIds } },
            select: { equipment_id: true, equipment_name: true },
          })).map(e => [e.equipment_id.toString(), e.equipment_name])
        : [],
    );
    const data = rawData.map(({ warehouse_facilities, ...rest }) => ({
      ...rest,
      facility_name: warehouse_facilities?.facility_name ?? null,
      equipment_name: equipmentMap.get(rest.equipment_id.toString()) ?? null,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, maintenanceId: bigint) {
    const record = await this.prisma.equipment_maintenance.findFirst({
      where: { tenant_id: tenantId, maintenance_id: maintenanceId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');
    const equipment = record.equipment_id
      ? await this.prisma.warehouse_equipment.findFirst({
          where: { equipment_id: record.equipment_id },
          select: { equipment_name: true },
        })
      : null;
    const { warehouse_facilities, ...rest } = record;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null, equipment_name: equipment?.equipment_name ?? null };
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
        maintenance_cost: dto.maintenance_cost,
        duration_minutes: dto.duration_minutes,
        notes: dto.notes,
        performed_by_user_id: dto.performed_by_user_id || userId,
        technician_name: dto.technician_name,
        next_maintenance_date: dto.next_maintenance_date ? new Date(dto.next_maintenance_date) : undefined,
        updated_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const eqName = result.equipment_id
      ? await this.prisma.warehouse_equipment.findFirst({
          where: { equipment_id: result.equipment_id },
          select: { equipment_name: true },
        })
      : null;

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

    const { warehouse_facilities, ...restResult } = result;
    return { ...restResult, facility_name: warehouse_facilities?.facility_name ?? null, equipment_name: eqName?.equipment_name ?? null };
  }

  async delete(tenantId: string, maintenanceId: bigint) {
    return this.prisma.equipment_maintenance.deleteMany({
      where: { tenant_id: tenantId, maintenance_id: maintenanceId },
    });
  }
}
