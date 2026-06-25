import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComponentDto } from './dtos/create-work-order.dto';

@Injectable()
export class ComponentsService {
  private readonly logger = new Logger(ComponentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addComponent(workOrderId: string, dto: CreateComponentDto, tenantId: string): Promise<any> {
    const order = await this.prisma.workOrder.findFirst({ where: { id: workOrderId, tenantId } });
    if (!order) throw new NotFoundException('Work order not found');
    if (order.status !== 'DRAFT') throw new BadRequestException('Can only add components to DRAFT work orders');

    return this.prisma.workOrderComponent.create({
      data: {
        tenantId,
        workOrderId,
        productId: dto.productId,
        lotId: dto.lotId,
        quantityRequired: dto.quantityRequired,
        uomId: dto.uomId,
        notes: dto.notes,
      },
    });
  }

  async updateConsumedQuantity(workOrderId: string, componentId: string, quantityConsumed: number, tenantId: string): Promise<any> {
    const component = await this.prisma.workOrderComponent.findFirst({
      where: { id: componentId, workOrderId, tenantId },
    });
    if (!component) throw new NotFoundException('Component not found');

    return this.prisma.workOrderComponent.update({
      where: { id: componentId },
      data: { quantityConsumed },
    });
  }
}
