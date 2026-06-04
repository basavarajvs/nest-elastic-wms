import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReplenishmentTaskDto, CreateReplenishmentSuggestionDto, UpdateReplenishmentSuggestionDto, ReplenishmentFilterDto, ReplenishmentSuggestionDto } from './dtos/replenishment.dto';

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(tenantId: string, facilityId?: string): Promise<ReplenishmentSuggestionDto[]> {
    const productFilter: any = { tenantId, isActive: true, replenishmentMinQty: { not: null, gt: 0 } };

    const products = await (this.prisma as any).product.findMany({
      where: productFilter,
      select: { id: true, name: true, sku: true, replenishmentMinQty: true, replenishmentMaxQty: true },
    });

    const locationFilter: any = { tenantId, isPickLocation: true };
    if (facilityId) locationFilter.facilityId = facilityId;

    const pickLocations = await (this.prisma as any).storageLocation.findMany({
      where: locationFilter,
      select: { id: true, locationCode: true, facilityId: true },
    });

    const suggestions: ReplenishmentSuggestionDto[] = [];

    for (const product of products) {
      for (const pickLoc of pickLocations) {
        const onHand = await (this.prisma as any).inventoryOnHand.findFirst({
          where: {
            tenantId,
            facilityId: pickLoc.facilityId,
            productId: product.id,
            locationId: pickLoc.id,
          },
          select: { quantityOnHand: true },
        });

        const currentQty = onHand?.quantityOnHand ?? 0;
        const minQty = product.replenishmentMinQty ?? 0;
        const maxQty = product.replenishmentMaxQty ?? minQty * 2;

        if (currentQty < minQty) {
          const bulkLocation = await this.findBulkLocation(tenantId, product.id, pickLoc.facilityId);

          suggestions.push({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            pickLocationId: pickLoc.id,
            pickLocationCode: pickLoc.locationCode,
            currentQuantity: currentQty,
            minQuantity: minQty,
            maxQuantity: maxQty,
            suggestedQuantity: Math.min(maxQty - currentQty, maxQty),
            bulkLocationId: bulkLocation?.id ?? '',
            bulkLocationCode: bulkLocation?.locationCode ?? '',
          });
        }
      }
    }

    return suggestions;
  }

  async createSuggestion(dto: CreateReplenishmentSuggestionDto, tenantId: string, userId: string): Promise<any> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const fromLocation = await (this.prisma as any).storageLocation.findFirst({
      where: { id: dto.fromLocationId, tenantId },
    });
    if (!fromLocation) throw new NotFoundException('Source location not found');

    const toLocation = await (this.prisma as any).storageLocation.findFirst({
      where: { id: dto.toLocationId, tenantId },
    });
    if (!toLocation) throw new NotFoundException('Destination location not found');

    const taskNumber = `REPL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return (this.prisma as any).replenishmentTask.create({
      data: {
        tenantId,
        facilityId: fromLocation.facilityId,
        taskNumber,
        productId: dto.productId,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        requestedQuantity: dto.requestedQuantity,
        priority: dto.priority ?? 'MEDIUM',
        notes: dto.notes,
        assignedToUserId: userId,
      },
    });
  }

  async updateSuggestion(productId: string, dto: UpdateReplenishmentSuggestionDto, tenantId: string): Promise<any> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const data: any = {};
    if (dto.replenishmentMinQty !== undefined) data.replenishmentMinQty = dto.replenishmentMinQty;
    if (dto.replenishmentMaxQty !== undefined) data.replenishmentMaxQty = dto.replenishmentMaxQty;

    return (this.prisma as any).product.update({
      where: { id: productId },
      data,
    });
  }

  async deleteSuggestion(productId: string, tenantId: string): Promise<any> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    await (this.prisma as any).product.update({
      where: { id: productId },
      data: { replenishmentMinQty: null, replenishmentMaxQty: null },
    });
    return { success: true };
  }

  private async findBulkLocation(tenantId: string, productId: string, facilityId?: string): Promise<any> {
    const where: any = { tenantId, productId, quantityOnHand: { gt: 0 } };
    if (facilityId) where.facilityId = facilityId;

    const bulkOnHand = await (this.prisma as any).inventoryOnHand.findFirst({
      where,
      orderBy: { quantityOnHand: 'desc' },
      select: { locationId: true },
    });

    if (!bulkOnHand) return null;

    return (this.prisma as any).storageLocation.findUnique({
      where: { id: bulkOnHand.locationId },
      select: { id: true, locationCode: true },
    });
  }

  async createTask(dto: CreateReplenishmentTaskDto, tenantId: string, userId: string): Promise<any> {
    const taskNumber = `REPL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return (this.prisma as any).replenishmentTask.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        taskNumber,
        productId: dto.productId,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        requestedQuantity: dto.requestedQuantity,
        priority: dto.priority ?? 'MEDIUM',
        notes: dto.notes,
        assignedToUserId: userId,
      },
    });
  }

  async listTasks(tenantId: string, filter: ReplenishmentFilterDto): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filter.facilityId) where.facilityId = filter.facilityId;
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 50, 200);

    const [data, total] = await Promise.all([
      (this.prisma as any).replenishmentTask.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).replenishmentTask.count({ where }),
    ]);

    return { data, total };
  }

  async completeTask(taskId: string, fulfilledQuantity: number, tenantId: string, userId: string): Promise<any> {
    const task = await (this.prisma as any).replenishmentTask.findFirst({
      where: { id: taskId, tenantId, status: { not: 'COMPLETED' } },
    });
    if (!task) throw new NotFoundException('Replenishment task not found or already completed');

    return (this.prisma as any).replenishmentTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        fulfilledQuantity,
        completedByUserId: userId,
        completedAt: new Date(),
      },
    });
  }

  async cancelTask(taskId: string, tenantId: string): Promise<any> {
    const task = await (this.prisma as any).replenishmentTask.findFirst({
      where: { id: taskId, tenantId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (!task) throw new BadRequestException('Replenishment task not found or already completed/cancelled');

    return (this.prisma as any).replenishmentTask.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' },
    });
  }

  async getTaskById(taskId: string, tenantId: string): Promise<any> {
    const task = await (this.prisma as any).replenishmentTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new NotFoundException('Replenishment task not found');
    return task;
  }
}
