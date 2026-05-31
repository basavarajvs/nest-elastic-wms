import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dtos/create-po.dto';
import { UpdatePurchaseOrderDto } from './dtos/update-po.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePurchaseOrderDto, tenantId: string) {
    const existing = await (this.prisma as any).purchaseOrder.findFirst({
      where: { tenantId, facilityId: dto.facilityId, poNumber: dto.poNumber },
    });
    if (existing) {
      throw new BadRequestException(`PO ${dto.poNumber} already exists in this facility`);
    }

    const po = await (this.prisma as any).purchaseOrder.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        poNumber: dto.poNumber,
        vendorId: dto.vendorId || null,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : null,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        notes: dto.notes || null,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            facilityId: dto.facilityId,
            lineNumber: l.lineNumber,
            productId: l.productId,
            orderedQuantity: l.orderedQuantity,
            unitPrice: l.unitPrice || null,
            uomId: l.uomId,
            notes: l.notes || null,
          })),
        },
      },
      include: { lines: true },
    });

    this.logger.log(`PO created: ${dto.poNumber}`);
    this.eventEmitter.emit('purchase_order.created', { poId: po.id, poNumber: po.poNumber, tenantId });
    return po;
  }

  async findAll(tenantId: string, facilityId?: string, status?: string) {
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;
    return (this.prisma as any).purchaseOrder.findMany({
      where,
      include: { lines: true, _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const po = await (this.prisma as any).purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async updateStatus(id: string, tenantId: string, dto: UpdatePurchaseOrderDto) {
    const po = await (this.prisma as any).purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    const updated = await (this.prisma as any).purchaseOrder.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes },
    });

    this.eventEmitter.emit('purchase_order.status_changed', {
      poId: id, poNumber: po.poNumber, from: po.status, to: dto.status, tenantId,
    });
    return updated;
  }

  async delete(id: string, tenantId: string) {
    const po = await (this.prisma as any).purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    await (this.prisma as any).purchaseOrder.delete({ where: { id } });
    this.logger.log(`PO deleted: ${po.poNumber}`);
  }
}
