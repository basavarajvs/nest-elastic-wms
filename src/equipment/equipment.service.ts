import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: any) {
    const existing = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_code: dto.equipmentCode },
    });
    if (existing) {
      throw new BadRequestException('Equipment code already exists');
    }

    const created = await this.prisma.warehouse_equipment.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        equipment_name: dto.equipment_name,
        equipment_code: dto.equipment_code,
        equipment_type: dto.equipment_type,
        description: dto.description,
        model_number: dto.model_number,
        serial_number: dto.serial_number,
        manufacturer: dto.manufacturer,
        purchase_date: dto.purchase_date ? new Date(dto.purchase_date) : null,
        purchase_cost: dto.purchase_cost,
        status: dto.status || 'AVAILABLE',
        current_location_id: dto.current_location_id ? BigInt(dto.current_location_id) : null,
        assigned_user_id: dto.assigned_user_id,
        last_maintenance_date: dto.last_maintenance_date ? new Date(dto.last_maintenance_date) : null,
        next_maintenance_date: dto.next_maintenance_date ? new Date(dto.next_maintenance_date) : null,
        maintenance_interval_months: dto.maintenance_interval_months ?? 3,
        is_active: dto.is_active ?? true,
        created_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf, ...restCreate } = created;
    return { ...restCreate, facility_name: wf?.facility_name ?? null };
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.equipmentType) where.equipment_type = query.equipmentType;
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.search) {
      where.OR = [
        { equipment_name: { contains: query.search, mode: 'insensitive' } },
        { equipment_code: { contains: query.search, mode: 'insensitive' } },
        { serial_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [rawData, total] = await Promise.all([
      this.prisma.warehouse_equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { equipment_code: 'asc' },
        include: { warehouse_facilities: { select: { facility_name: true } } },
      }),
      this.prisma.warehouse_equipment.count({ where }),
    ]);
    const data = rawData.map(({ warehouse_facilities, ...rest }) => ({
      ...rest,
      facility_name: warehouse_facilities?.facility_name ?? null,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, equipmentId: bigint) {
    const equipment = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: equipmentId, is_deleted: false },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    const { warehouse_facilities, ...rest } = equipment;
    return { ...rest, facility_name: warehouse_facilities?.facility_name ?? null };
  }

  async update(tenantId: string, userId: string, equipmentId: bigint, dto: any) {
    await this.findById(tenantId, equipmentId);

    if (dto.equipment_code) {
      const existing = await this.prisma.warehouse_equipment.findFirst({
        where: {
          tenant_id: tenantId,
          equipment_code: dto.equipment_code,
          equipment_id: { not: equipmentId },
        },
      });
      if (existing) throw new BadRequestException('Equipment code already exists');
    }

    const updated = await this.prisma.warehouse_equipment.update({
      where: { equipment_id: equipmentId },
      data: {
        equipment_name: dto.equipment_name,
        equipment_code: dto.equipment_code,
        equipment_type: dto.equipment_type,
        description: dto.description,
        model_number: dto.model_number,
        serial_number: dto.serial_number,
        manufacturer: dto.manufacturer,
        purchase_date: dto.purchase_date ? new Date(dto.purchase_date) : undefined,
        purchase_cost: dto.purchase_cost,
        current_location_id: dto.current_location_id ? BigInt(dto.current_location_id) : undefined,
        assigned_user_id: dto.assigned_user_id,
        last_maintenance_date: dto.last_maintenance_date ? new Date(dto.last_maintenance_date) : undefined,
        next_maintenance_date: dto.next_maintenance_date ? new Date(dto.next_maintenance_date) : undefined,
        maintenance_interval_months: dto.maintenance_interval_months,
        is_active: dto.is_active,
        updated_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf2, ...restUpdate } = updated;
    return { ...restUpdate, facility_name: wf2?.facility_name ?? null };
  }

  async updateStatus(tenantId: string, userId: string, equipmentId: bigint, status: string) {
    await this.findById(tenantId, equipmentId);

    const validTransitions: Record<string, string[]> = {
      AVAILABLE: ['IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
      IN_USE: ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
      MAINTENANCE: ['AVAILABLE', 'IN_USE', 'OUT_OF_SERVICE'],
      OUT_OF_SERVICE: ['AVAILABLE', 'DECOMMISSIONED'],
      DECOMMISSIONED: [],
    };

    const current = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: equipmentId },
    });

    const allowed = validTransitions[current!.status] || [];
    if (!allowed.includes(status as any)) {
      throw new BadRequestException(
        `Cannot transition from ${current!.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.warehouse_equipment.update({
      where: { equipment_id: equipmentId },
      data: {
        status: status as any,
        updated_by: userId,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    const { warehouse_facilities: wf3, ...restStatus } = updated;
    return { ...restStatus, facility_name: wf3?.facility_name ?? null };
  }

  async delete(tenantId: string, equipmentId: bigint) {
    return this.prisma.warehouse_equipment.deleteMany({
      where: { tenant_id: tenantId, equipment_id: equipmentId },
    });
  }
}
