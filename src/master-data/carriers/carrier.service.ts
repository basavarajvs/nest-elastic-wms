import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarrierDto, UpdateCarrierDto } from './dtos/create-carrier.dto';

@Injectable()
export class CarrierService {
  private readonly logger = new Logger(CarrierService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCarrierDto, tenantId: string) {
    const existing = await (this.prisma as any).carrier.findFirst({
      where: { tenantId, carrierCode: dto.carrierCode },
    });
    if (existing) throw new BadRequestException(`Carrier ${dto.carrierCode} already exists`);

    return (this.prisma as any).carrier.create({
      data: {
        tenantId,
        carrierCode: dto.carrierCode,
        name: dto.name,
        scac: dto.scac || null,
        website: dto.website || null,
        phone: dto.phone || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).carrier.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async findById(id: string, tenantId: string) {
    const c = await (this.prisma as any).carrier.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Carrier not found');
    return c;
  }

  async update(id: string, tenantId: string, dto: UpdateCarrierDto) {
    const c = await (this.prisma as any).carrier.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Carrier not found');
    return (this.prisma as any).carrier.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const c = await (this.prisma as any).carrier.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Carrier not found');
    await (this.prisma as any).carrier.delete({ where: { id } });
  }
}
