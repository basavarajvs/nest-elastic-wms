import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto, CompleteMaintenanceDto, ListMaintenanceDto } from './dtos/equipment.dto';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenanceDto, tenantId: string): Promise<any> {
    const equipment = await this.prisma.warehouseEquipment.findFirst({
      where: { id: dto.equipmentId, tenantId },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');

    const count = await this.prisma.equipmentMaintenance.count({
      where: { tenantId },
    });
    const maintenanceNumber = `MNT-${String(count + 1).padStart(6, '0')}`;

    const record = await this.prisma.equipmentMaintenance.create({
      data: {
        tenantId,
        facilityId: equipment.facilityId,
        equipmentId: dto.equipmentId,
        maintenanceNumber,
        maintenanceType: dto.maintenanceType,
        priority: dto.priority ?? 'MEDIUM',
        description: dto.description ?? undefined,
        performedByUserId: dto.performedByUserId ?? undefined,
        cost: dto.cost ?? undefined,
        downtimeMinutes: dto.downtimeMinutes ?? undefined,
        notes: dto.notes ?? undefined,
      },
    });

    await this.prisma.warehouseEquipment.update({
      where: { id: dto.equipmentId },
      data: { status: 'MAINTENANCE' },
    });

    return record;
  }

  async list(tenantId: string, filters: ListMaintenanceDto): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.equipmentId) where.equipmentId = filters.equipmentId;
    if (filters.status) where.status = filters.status;
    return this.prisma.equipmentMaintenance.findMany({
      where,
      include: { equipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async complete(id: string, dto: CompleteMaintenanceDto, tenantId: string): Promise<any> {
    const record = await this.prisma.equipmentMaintenance.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');
    if (record.status === 'COMPLETED' || record.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot complete maintenance with status ${record.status}`);
    }

    const completed = await this.prisma.equipmentMaintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        cost: dto.cost ?? undefined,
        downtimeMinutes: dto.downtimeMinutes ?? undefined,
        performedByUserId: dto.performedByUserId ?? undefined,
        notes: dto.notes ?? undefined,
      },
    });

    await this.prisma.warehouseEquipment.update({
      where: { id: record.equipmentId },
      data: {
        status: 'AVAILABLE',
        lastMaintenanceAt: new Date(),
      },
    });

    return completed;
  }
}
