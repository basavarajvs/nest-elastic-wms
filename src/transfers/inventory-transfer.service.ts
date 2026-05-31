import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryTransactionService } from '../inventory/inventory-transaction.service';
import { CreateTransferDto, ReceiveLpnTransferDto, UpdateTransferLineDto } from './dtos/transfer.dto';

@Injectable()
export class InventoryTransferService {
  private readonly logger = new Logger(InventoryTransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly txnService: InventoryTransactionService,
  ) {}

  async create(dto: CreateTransferDto, tenantId: string, userId: string): Promise<any> {
    const count = await (this.prisma as any).inventoryTransfer.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const now = new Date();
    const transferNumber = `TRF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

    return (this.prisma as any).inventoryTransfer.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        transferNumber,
        transferType: dto.transferType,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        toFacilityId: dto.toFacilityId,
        requestedByUserId: userId,
        notes: dto.notes,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: l.productId,
            lotId: l.lotId,
            quantityRequested: l.quantityRequested,
            uomId: l.uomId,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async initiateDispatch(transferId: string, tenantId: string, userId: string): Promise<any> {
    const transfer = await (this.prisma as any).inventoryTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new BadRequestException('Transfer not found');
    if (transfer.status !== 'DRAFT') throw new BadRequestException('Transfer must be in DRAFT status');

    return (this.prisma as any).$transaction(async (tx: any) => {
      for (const line of transfer.lines) {
        const onHand = await tx.inventoryOnHand.findFirst({
          where: {
            tenantId,
            facilityId: transfer.facilityId,
            productId: line.productId,
            locationId: transfer.fromLocationId || transfer.toLocationId,
          },
        });

        if (transfer.transferType === 'INTRA_FACILITY') {
          await tx.inventoryOnHand.updateMany({
            where: { tenantId, facilityId: transfer.facilityId, productId: line.productId },
            data: { quantityOnHand: { decrement: line.quantityRequested } },
          });
        }

        await tx.inventoryTransferLine.update({
          where: { id: line.id },
          data: { quantityShipped: line.quantityRequested, status: 'SHIPPED' },
        });
      }

      await tx.inventoryTransfer.update({
        where: { id: transferId },
        data: { status: 'DISPATCHED', dispatchedByUserId: userId },
      });

      this.eventEmitter.emit('transfer.dispatched', { transferId, tenantId });
      return { status: 'DISPATCHED' };
    });
  }

  async receiveLPN(dto: ReceiveLpnTransferDto, tenantId: string, userId: string): Promise<any> {
    const transfer = await (this.prisma as any).inventoryTransfer.findFirst({
      where: { id: dto.transferId, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new BadRequestException('Transfer not found');

    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { lpnNumber: dto.lpnNumber, tenantId },
    });
    if (!lpn) throw new BadRequestException('LPN not found');

    return (this.prisma as any).$transaction(async (tx: any) => {
      let remaining = lpn.quantity;
      for (const line of transfer.lines) {
        if (remaining <= 0) break;
        if (line.productId !== lpn.productId) continue;

        const take = Math.min(remaining, line.quantityRequested - line.quantityReceived);
        if (take <= 0) continue;

        await tx.inventoryTransferLine.update({
          where: { id: line.id },
          data: {
            quantityReceived: { increment: take },
            status: line.quantityReceived + take >= line.quantityRequested ? 'RECEIVED' : 'RECEIVED',
          },
        });

        await tx.inventoryOnHand.upsert({
          where: {
            inventory_on_hand_uq: {
              tenantId,
              facilityId: transfer.toFacilityId || transfer.facilityId,
              productId: line.productId,
              locationId: transfer.toLocationId,
              lotId: line.lotId || '00000000-0000-0000-0000-000000000000',
            },
          },
          update: { quantityOnHand: { increment: take } },
          create: {
            tenantId,
            facilityId: transfer.toFacilityId || transfer.facilityId,
            productId: line.productId,
            locationId: transfer.toLocationId,
            lotId: line.lotId || '00000000-0000-0000-0000-000000000000',
            quantityOnHand: take,
            uomId: line.uomId,
          },
        });

        remaining -= take;
      }

      await tx.lPN.update({
        where: { id: lpn.id },
        data: { locationId: transfer.toLocationId },
      });

      const allReceived = transfer.lines.every((l: any) =>
        l.quantityReceived >= l.quantityRequested
      );
      if (allReceived) {
        await tx.inventoryTransfer.update({
          where: { id: dto.transferId },
          data: { status: 'RECEIVED', receivedByUserId: userId },
        });
      }

      return { success: true, lpnNumber: dto.lpnNumber, transferComplete: allReceived };
    });
  }

  async reconcileDiscrepancies(transferId: string, tenantId: string): Promise<any> {
    const transfer = await (this.prisma as any).inventoryTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: { lines: true },
    });
    if (!transfer) throw new BadRequestException('Transfer not found');

    const discrepancies: any[] = [];
    for (const line of transfer.lines) {
      const variance = line.quantityRequested - line.quantityReceived;
      if (Math.abs(variance) > 0.001) {
        const approval = await (this.prisma as any).adjustmentApproval.create({
          data: {
            tenantId,
            facilityId: transfer.facilityId,
            transferLineId: line.id,
            varianceValue: Math.abs(variance) * 10,
            varianceQty: Math.abs(variance),
            approvalLevel: 'AUTO_APPROVED',
            requestedByUserId: 'SYSTEM',
          },
        });
        discrepancies.push({ lineId: line.id, variance, approvalId: approval.id });
      }
    }
    return { transferId, discrepancies };
  }

  async list(tenantId: string, filters: {
    status?: string;
    transferType?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.transferType) where.transferType = filters.transferType;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).inventoryTransfer.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).inventoryTransfer.count({ where }),
    ]);
    return { data, total };
  }

  async listLines(tenantId: string, filters: {
    transferId?: string;
    productId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.transferId) where.transferId = filters.transferId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).inventoryTransferLine.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).inventoryTransferLine.count({ where }),
    ]);
    return { data, total };
  }

  async getLine(lineId: string, tenantId: string): Promise<any> {
    const line = await (this.prisma as any).inventoryTransferLine.findFirst({
      where: { id: lineId, tenantId },
    });
    if (!line) throw new BadRequestException('Transfer line not found');
    return line;
  }

  async updateLine(lineId: string, dto: UpdateTransferLineDto, tenantId: string): Promise<any> {
    const line = await (this.prisma as any).inventoryTransferLine.findFirst({
      where: { id: lineId, tenantId },
    });
    if (!line) throw new BadRequestException('Transfer line not found');

    return (this.prisma as any).inventoryTransferLine.update({
      where: { id: lineId },
      data: {
        ...(dto.quantityRequested !== undefined && { quantityRequested: dto.quantityRequested }),
        ...(dto.quantityShipped !== undefined && { quantityShipped: dto.quantityShipped }),
        ...(dto.quantityReceived !== undefined && { quantityReceived: dto.quantityReceived }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }
}
