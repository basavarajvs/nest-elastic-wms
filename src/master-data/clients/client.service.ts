import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dtos/create-client.dto';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto, tenantId: string) {
    const existing = await (this.prisma as any).client.findFirst({
      where: { tenantId, clientCode: dto.clientCode },
    });
    if (existing) throw new BadRequestException(`Client ${dto.clientCode} already exists`);

    return (this.prisma as any).client.create({
      data: {
        tenantId,
        clientCode: dto.clientCode,
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
    return (this.prisma as any).client.findMany({
      where: { tenantId },
      include: { _count: { select: { contacts: true, addresses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const c = await (this.prisma as any).client.findFirst({
      where: { id, tenantId },
      include: { contacts: true, addresses: true },
    });
    if (!c) throw new NotFoundException('Client not found');
    return c;
  }

  async update(id: string, tenantId: string, dto: UpdateClientDto) {
    const c = await (this.prisma as any).client.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Client not found');
    return (this.prisma as any).client.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const c = await (this.prisma as any).client.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Client not found');
    await (this.prisma as any).client.delete({ where: { id } });
  }
}
