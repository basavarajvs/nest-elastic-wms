import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto, ChangeEquipmentStatusDto, ListEquipmentDto } from './dtos/equipment.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto, tenantId: string): Promise<any> {
    return this.prisma.warehouseEquipment.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        equipmentCode: dto.equipmentCode,
        equipmentName: dto.equipmentName,
        equipmentType: dto.equipmentType,
        manufacturer: dto.manufacturer ?? undefined,
        model: dto.model ?? undefined,
        serialNumber: dto.serialNumber ?? undefined,
        year: dto.year ?? undefined,
        locationId: dto.locationId ?? undefined,
        notes: dto.notes ?? undefined,
      },
    });
  }

  async list(tenantId: string, filters: ListEquipmentDto): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.equipmentType) where.equipmentType = filters.equipmentType;
    if (filters.status) where.status = filters.status;
    return this.prisma.warehouseEquipment.findMany({ where, orderBy: { equipmentCode: 'asc' } });
  }

  async update(id: string, dto: UpdateEquipmentDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    return this.prisma.warehouseEquipment.update({ where: { id }, data: dto });
  }

  async changeStatus(id: string, dto: ChangeEquipmentStatusDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    return this.prisma.warehouseEquipment.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes ?? undefined },
    });
  }

  async checkOut(id: string, tenantId: string): Promise<any> {
    const equipment = await this.findById(id, tenantId);
    if (equipment.status !== 'AVAILABLE') {
      throw new BadRequestException(`Cannot check out equipment with status ${equipment.status}`);
    }
    return this.prisma.warehouseEquipment.update({
      where: { id },
      data: { status: 'IN_USE' },
    });
  }

  async checkIn(id: string, tenantId: string): Promise<any> {
    const equipment = await this.findById(id, tenantId);
    if (equipment.status !== 'IN_USE') {
      throw new BadRequestException(`Cannot check in equipment with status ${equipment.status}`);
    }
    return this.prisma.warehouseEquipment.update({
      where: { id },
      data: { status: 'AVAILABLE' },
    });
  }

  async listAvailable(tenantId: string, facilityId: string): Promise<any> {
    return this.prisma.warehouseEquipment.findMany({
      where: { tenantId, facilityId, status: 'AVAILABLE' },
      orderBy: { equipmentCode: 'asc' },
    });
  }

  private async findById(id: string, tenantId: string): Promise<any> {
    const equipment = await this.prisma.warehouseEquipment.findFirst({ where: { id, tenantId } });
    if (!equipment) throw new NotFoundException('Warehouse equipment not found');
    return equipment;
  }
}
