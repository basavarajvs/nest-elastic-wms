import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateGrnAdHocDto, RfReceiveDto } from './dtos/grn.dto';
import { InventoryTransactionService } from '../inventory/inventory-transaction.service';

@Injectable()
export class GrnService {
  private readonly logger = new Logger(GrnService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly eventEmitter: EventEmitter2,
    private readonly txnService: InventoryTransactionService,
  ) {}

  async createFromAsn(asnNumber: string, tenantId: string): Promise<any> {
    const asn = await (this.prisma as any).advanceShipNotice.findFirst({
      where: { asnNumber, tenantId },
      include: { lines: true },
    });
    if (!asn) throw new BadRequestException('ASN not found');

    const receiptNumber = await this.generateReceiptNumber(tenantId, asn.facilityId);
    const grn = await (this.prisma as any).goodsReceipt.create({
      data: {
        tenantId,
        facilityId: asn.facilityId,
        receiptNumber,
        asnNumber,
        poNumber: asn.poNumber,
        vendorId: asn.vendorId,
        status: 'CREATED',
        lines: {
          create: asn.lines.map((l: any) => ({
            tenantId,
            facilityId: asn.facilityId,
            asnLineId: l.id,
            productId: l.productId,
            expectedQuantity: l.expectedQuantity,
            uomId: l.uomId,
            lotNumber: l.lotNumber,
            expiryDate: l.expiryDate,
          })),
        },
      },
      include: { lines: true },
    });

    await (this.prisma as any).advanceShipNotice.update({
      where: { id: asn.id },
      data: { status: 'ARRIVED', actualArrivalDate: new Date() },
    });

    this.eventEmitter.emit('grn.created', { grnId: grn.id, tenantId });
    return grn;
  }

  async createAdHoc(dto: CreateGrnAdHocDto, tenantId: string): Promise<any> {
    const receiptNumber = await this.generateReceiptNumber(tenantId, dto.facilityId);
    return (this.prisma as any).goodsReceipt.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        receiptNumber,
        poNumber: dto.poNumber,
        vendorId: dto.vendorId,
        status: 'CREATED',
        qcRequired: dto.qcRequired ?? false,
      },
    });
  }

  async receiveLine(dto: RfReceiveDto, tenantId: string): Promise<any> {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id: dto.grnLineId, tenantId },
      include: { receipt: true },
    });
    if (!line) throw new BadRequestException('GRN line not found');

    const newReceived = line.receivedQuantity + dto.quantity;
    if (newReceived > line.expectedQuantity + 0.001) {
      throw new BadRequestException('QuantityExceededException');
    }

    const lineLots = (line.lineLots as any[]) || [];
    if (dto.lotNumber) {
      lineLots.push({
        lotNumber: dto.lotNumber,
        quantity: dto.quantity,
        expiryDate: dto.expiryDate || line.expiryDate?.toISOString(),
      });
    }

    const lineStatus = newReceived >= line.expectedQuantity - 0.001 ? 'RECEIVED' : 'RECEIVING';
    const damagedQty = dto.damagedQuantity ?? 0;

    return (this.prisma as any).$transaction(async (tx: any) => {
      const lpnNumber = dto.lpnNumber || `LPN-${line.facilityId.slice(0, 4).toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const lpn = await tx.lPN.upsert({
        where: { lpn_number_uq: { tenantId, lpnNumber } },
        update: {
          quantity: { increment: dto.quantity },
          locationId: dto.locationId || line.receipt.facilityId,
          status: 'RECEIVED',
          productId: line.productId,
          lotNumber: dto.lotNumber || line.lotNumber,
          uomId: line.uomId,
          grnLineId: line.id,
        },
        create: {
          tenantId,
          facilityId: line.facilityId,
          lpnNumber,
          lpnType: 'PALLET',
          status: 'RECEIVED',
          locationId: dto.locationId || line.receipt.facilityId,
          productId: line.productId,
          lotNumber: dto.lotNumber || line.lotNumber,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : line.expiryDate,
          quantity: dto.quantity,
          uomId: line.uomId,
          grnLineId: line.id,
        },
      });

      await tx.goodsReceiptLine.update({
        where: { id: dto.grnLineId },
        data: {
          receivedQuantity: newReceived,
          damagedQuantity: { increment: damagedQty },
          status: lineStatus,
          lineLots: lineLots.length > 0 ? lineLots : undefined,
        },
      });

      if (dto.lotNumber) {
        const lot = await tx.inventoryLot.findFirst({
          where: { tenantId, facilityId: line.facilityId, productId: line.productId, lotNumber: dto.lotNumber },
        });
        if (!lot && dto.lotNumber) {
          await tx.inventoryLot.create({
            data: {
              tenantId,
              facilityId: line.facilityId,
              productId: line.productId,
              lotNumber: dto.lotNumber,
              expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            },
          });
        }
      }

      this.eventEmitter.emit('lpn.received', { lpnId: lpn.id, lpnNumber, tenantId, grnLineId: dto.grnLineId });

      const remaining = await this.getRemainingLines(line.receiptId, tenantId);
      const nextLine = remaining.find((r: any) => r.receivedQuantity < r.expectedQuantity);

      return { success: true, lpnNumber, grnLineId: dto.grnLineId, receivedQuantity: newReceived, lineStatus, nextLine: nextLine || null };
    });
  }

  async completeReceipt(grnId: string, tenantId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const grn = await tx.goodsReceipt.findFirst({
        where: { id: grnId, tenantId },
        include: { lines: true },
      });
      if (!grn) throw new BadRequestException('GRN not found');

      await tx.goodsReceipt.update({
        where: { id: grnId },
        data: { status: 'COMPLETED' },
      });

      this.eventEmitter.emit('grn.completed', { grnId, tenantId, facilityId: grn.facilityId });
      return { status: 'COMPLETED', pendingPutawayTasks: grn.lines.length };
    });
  }

  async getProgress(grnId: string, tenantId: string): Promise<any> {
    const grn = await (this.prisma as any).goodsReceipt.findFirst({
      where: { id: grnId, tenantId },
      include: { lines: true },
    });
    if (!grn) throw new BadRequestException('GRN not found');
    return grn;
  }

  async getLinesForReceiving(tenantId: string, facilityId: string): Promise<any[]> {
    return (this.prisma as any).goodsReceiptLine.findMany({
      where: {
        tenantId,
        facilityId,
        status: { in: ['OPEN', 'RECEIVING'] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async getRemainingLines(receiptId: string, tenantId: string): Promise<any[]> {
    return (this.prisma as any).goodsReceiptLine.findMany({
      where: { receiptId, tenantId },
    });
  }

  private async generateReceiptNumber(tenantId: string, facilityId: string): Promise<string> {
    const count = await (this.prisma as any).goodsReceipt.count({
      where: { tenantId, facilityId },
    });
    return `GRN-${facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;
  }
}
