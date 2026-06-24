import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos/create-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, tenantId: string) {
    const existing = await (this.prisma as any).customer.findFirst({
      where: { tenantId, customerCode: dto.customerCode },
    });
    if (existing) throw new BadRequestException(`Customer ${dto.customerCode} already exists`);

    return (this.prisma as any).customer.create({
      data: {
        tenantId,
        customerCode: dto.customerCode,
        name: dto.name,
        customerType: dto.customerType,
        primaryContactName: dto.primaryContactName,
        primaryEmail: dto.primaryEmail,
        primaryPhone: dto.primaryPhone,
        billingAddressLine1: dto.billingAddressLine1,
        billingAddressLine2: dto.billingAddressLine2,
        billingCity: dto.billingCity,
        billingState: dto.billingState,
        billingPostalCode: dto.billingPostalCode,
        billingCountry: dto.billingCountry,
        shippingAddressLine1: dto.shippingAddressLine1,
        shippingAddressLine2: dto.shippingAddressLine2,
        shippingCity: dto.shippingCity,
        shippingState: dto.shippingState,
        shippingPostalCode: dto.shippingPostalCode,
        shippingCountry: dto.shippingCountry,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(tenantId: string, isActive?: boolean) {
    const where: any = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;
    return (this.prisma as any).customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const c = await (this.prisma as any).customer.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    const c = await (this.prisma as any).customer.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Customer not found');
    return (this.prisma as any).customer.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    const c = await (this.prisma as any).customer.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Customer not found');
    await (this.prisma as any).customer.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
