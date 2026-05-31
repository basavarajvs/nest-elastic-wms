import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductClientAssignmentDto, UpdateProductClientAssignmentDto } from './dtos/create-product-client-assignment.dto';

@Injectable()
export class ProductClientAssignmentsService {
  private readonly logger = new Logger(ProductClientAssignmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductClientAssignmentDto, tenantId: string): Promise<any> {
    const existing = await (this.prisma as any).productClientAssignment.findFirst({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        clientId: dto.clientId,
      },
    });
    if (existing) throw new BadRequestException('Assignment already exists for this product and client');

    return (this.prisma as any).productClientAssignment.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        clientId: dto.clientId,
        isActive: dto.isActive ?? true,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string): Promise<any> {
    return (this.prisma as any).productClientAssignment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const assignment = await (this.prisma as any).productClientAssignment.findFirst({
      where: { id, tenantId },
    });
    if (!assignment) throw new NotFoundException('Product-client assignment not found');
    return assignment;
  }

  async findByProduct(productId: string, tenantId: string): Promise<any> {
    return (this.prisma as any).productClientAssignment.findMany({
      where: { productId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string, tenantId: string): Promise<any> {
    return (this.prisma as any).productClientAssignment.findMany({
      where: { clientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateProductClientAssignmentDto, tenantId: string): Promise<any> {
    await this.findById(id, tenantId);
    return (this.prisma as any).productClientAssignment.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).productClientAssignment.delete({ where: { id } });
  }
}
