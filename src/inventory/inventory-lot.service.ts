import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InventoryLotService {
  private readonly logger = new Logger(InventoryLotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLot(dto: {
    tenantId: string;
    facilityId: string;
    productId: string;
    lotNumber: string;
    supplierLotNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    status?: string;
  }): Promise<any> {
    const product = await (this.prisma as any).product.findFirst({
      where: { id: dto.productId, tenantId: dto.tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await (this.prisma as any).inventoryLot.findFirst({
      where: {
        tenantId: dto.tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        lotNumber: dto.lotNumber,
      },
    });
    if (existing) throw new BadRequestException(`Lot "${dto.lotNumber}" already exists for this product`);

    const lot = await (this.prisma as any).inventoryLot.create({
      data: {
        tenantId: dto.tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        lotNumber: dto.lotNumber,
        supplierLotNumber: dto.supplierLotNumber,
        mfgDate: dto.mfgDate ? new Date(dto.mfgDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        status: dto.status ?? 'AVAILABLE',
      },
    });

    this.eventEmitter.emit('inventory.lot.created', { lotId: lot.id, tenantId: dto.tenantId });
    return lot;
  }

  async findByProduct(productId: string, tenantId: string): Promise<any> {
    return (this.prisma as any).inventoryLot.findMany({
      where: { productId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailableLots(productId: string, tenantId: string, facilityId: string, quantity?: number): Promise<any> {
    const where: any = {
      productId,
      tenantId,
      facilityId,
      status: 'AVAILABLE',
    };

    const lots = await (this.prisma as any).inventoryLot.findMany({
      where,
      include: {
        onHands: {
          where: { tenantId, facilityId, productId },
          select: { id: true, locationId: true, quantityOnHand: true, quantityAllocated: true },
        },
      },
      orderBy: [{ expiryDate: 'asc' }, { receivedDate: 'asc' }],
    });

    const filtered = lots.map((lot: any) => {
      const availableQty = (lot.onHands || []).reduce(
        (sum: number, oh: any) => sum + (oh.quantityOnHand - oh.quantityAllocated),
        0,
      );
      return { ...lot, availableQuantity: availableQty };
    });

    if (quantity) {
      return filtered.filter((lot: any) => lot.availableQuantity > 0);
    }
    return filtered;
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const lot = await (this.prisma as any).inventoryLot.findFirst({
      where: { id, tenantId },
      include: {
        onHands: {
          include: { location: true },
        },
      },
    });
    if (!lot) throw new NotFoundException('Lot not found');
    return lot;
  }

  async updateStatus(id: string, status: string, tenantId: string): Promise<any> {
    const lot = await this.findById(id, tenantId);
    const validStatuses = ['AVAILABLE', 'RESERVED', 'CONSUMED', 'EXPIRED', 'QUARANTINED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid lot status: ${status}`);
    }
    const updated = await (this.prisma as any).inventoryLot.update({
      where: { id },
      data: { status },
    });
    this.eventEmitter.emit('inventory.lot.status_changed', { lotId: id, status, tenantId });
    return updated;
  }

  async getTransactionHistory(lotId: string, tenantId: string): Promise<any> {
    await this.findById(lotId, tenantId);
    return (this.prisma as any).inventoryTransaction.findMany({
      where: { lotId, tenantId },
      orderBy: { transactionAt: 'desc' },
      take: 100,
    });
  }
}
