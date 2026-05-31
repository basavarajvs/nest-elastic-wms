import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto } from './dtos/create-vendor.dto';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVendorDto, tenantId: string) {
    const existing = await (this.prisma as any).vendor.findFirst({
      where: { tenantId, vendorCode: dto.vendorCode },
    });
    if (existing) throw new BadRequestException(`Vendor ${dto.vendorCode} already exists`);

    return (this.prisma as any).vendor.create({
      data: {
        tenantId,
        vendorCode: dto.vendorCode,
        name: dto.name,
        isActive: dto.isActive ?? true,
        contacts: dto.contacts?.length ? {
          create: dto.contacts.map((c) => ({
            tenantId,
            firstName: c.firstName || null,
            lastName: c.lastName || null,
            email: c.email || null,
            phone: c.phone || null,
            isPrimary: c.isPrimary || false,
          })),
        } : undefined,
        addresses: dto.addresses?.length ? {
          create: dto.addresses.map((a) => ({
            tenantId,
            addressType: a.addressType || null,
            addressLine1: a.addressLine1 || null,
            addressLine2: a.addressLine2 || null,
            city: a.city || null,
            state: a.state || null,
            postalCode: a.postalCode || null,
            country: a.country || null,
            isDefault: a.isDefault || false,
          })),
        } : undefined,
      },
      include: { contacts: true, addresses: true },
    });
  }

  async findAll(tenantId: string) {
    return (this.prisma as any).vendor.findMany({
      where: { tenantId },
      include: { _count: { select: { contacts: true, addresses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const v = await (this.prisma as any).vendor.findFirst({
      where: { id, tenantId },
      include: { contacts: true, addresses: true },
    });
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  async update(id: string, tenantId: string, dto: UpdateVendorDto) {
    const v = await (this.prisma as any).vendor.findFirst({ where: { id, tenantId } });
    if (!v) throw new NotFoundException('Vendor not found');
    return (this.prisma as any).vendor.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const v = await (this.prisma as any).vendor.findFirst({ where: { id, tenantId } });
    if (!v) throw new NotFoundException('Vendor not found');
    await (this.prisma as any).vendor.delete({ where: { id } });
  }
}
