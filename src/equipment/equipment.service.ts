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

    return this.prisma.warehouse_equipment.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        equipment_name: dto.equipmentName,
        equipment_code: dto.equipmentCode,
        equipment_type: dto.equipmentType,
        description: dto.description,
        model_number: dto.modelNumber,
        serial_number: dto.serialNumber,
        manufacturer: dto.manufacturer,
        purchase_date: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchase_cost: dto.purchaseCost,
        status: dto.status || 'AVAILABLE',
        current_location_id: dto.currentLocationId ? BigInt(dto.currentLocationId) : null,
        assigned_user_id: dto.assignedUserId,
        last_maintenance_date: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : null,
        next_maintenance_date: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        maintenance_interval_months: dto.maintenanceIntervalMonths ?? 3,
        is_active: dto.isActive ?? true,
        created_by: userId,
      },
    });
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

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.warehouse_equipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { equipment_code: 'asc' },
      }),
      this.prisma.warehouse_equipment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, equipmentId: bigint) {
    const equipment = await this.prisma.warehouse_equipment.findFirst({
      where: { tenant_id: tenantId, equipment_id: equipmentId, is_deleted: false },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  async update(tenantId: string, userId: string, equipmentId: bigint, dto: any) {
    await this.findById(tenantId, equipmentId);

    if (dto.equipmentCode) {
      const existing = await this.prisma.warehouse_equipment.findFirst({
        where: {
          tenant_id: tenantId,
          equipment_code: dto.equipmentCode,
          equipment_id: { not: equipmentId },
        },
      });
      if (existing) throw new BadRequestException('Equipment code already exists');
    }

    return this.prisma.warehouse_equipment.update({
      where: { equipment_id: equipmentId },
      data: {
        equipment_name: dto.equipmentName,
        equipment_code: dto.equipmentCode,
        equipment_type: dto.equipmentType,
        description: dto.description,
        model_number: dto.modelNumber,
        serial_number: dto.serialNumber,
        manufacturer: dto.manufacturer,
        purchase_date: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchase_cost: dto.purchaseCost,
        current_location_id: dto.currentLocationId ? BigInt(dto.currentLocationId) : undefined,
        assigned_user_id: dto.assignedUserId,
        last_maintenance_date: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : undefined,
        next_maintenance_date: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : undefined,
        maintenance_interval_months: dto.maintenanceIntervalMonths,
        is_active: dto.isActive,
        updated_by: userId,
      },
    });
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

    return this.prisma.warehouse_equipment.update({
      where: { equipment_id: equipmentId },
      data: {
        status: status as any,
        updated_by: userId,
      },
    });
  }

  async delete(tenantId: string, equipmentId: bigint) {
    return this.prisma.warehouse_equipment.deleteMany({
      where: { tenant_id: tenantId, equipment_id: equipmentId },
    });
  }
}
