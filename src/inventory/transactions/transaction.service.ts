import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_transactions.deleteMany({
      where: { tenant_id: tenantId, transaction_id: id },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { productId, locationId, lotId, lpnId, transactionType, facilityId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (productId) where.product_id = BigInt(productId);
    if (locationId) where.from_location_id = BigInt(locationId);
    if (lotId) where.lot_id = BigInt(lotId);
    if (transactionType) where.transaction_type = transactionType;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_transactions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_transactions.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.inventory_transactions.findFirst({
      where: { tenant_id: tenantId, transaction_id: BigInt(id) },
    });
  }

  /** Web: Execute an inventory transaction and update on-hand quantities */
  async executeTransaction(tenantId: string, dto: any) {
    const { facilityId, productId, fromLocationId, toLocationId, lotId, quantity, transactionType, reasonCode, notes, userId } = dto;

    const txn = await this.prisma.inventory_transactions.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(facilityId),
        product_id: BigInt(productId),
        reference_type: dto.referenceType ?? 'MANUAL',
        reference_id: dto.referenceId ?? 0,
        from_location_id: fromLocationId ? BigInt(fromLocationId) : undefined,
        to_location_id: toLocationId ? BigInt(toLocationId) : undefined,
        lot_id: lotId ? BigInt(lotId) : undefined,
        transaction_type: transactionType,
        transaction_status: 'COMPLETED',
        quantity: quantity,
        uom_id: dto.uomId ?? 1,
        reason_code: reasonCode ?? 'MANUAL',
        notes,
        performed_by_user_id: userId,
        reference_document_type: dto.referenceDocumentType,
        reference_document_number: dto.referenceDocumentNumber,
      },
    });

    // Decrement source location
    if (fromLocationId) {
      const srcWhere: any = {
        tenant_id: tenantId,
        facility_id: BigInt(facilityId),
        product_id: BigInt(productId),
        location_id: BigInt(fromLocationId),
      };
      if (lotId) srcWhere.lot_id = BigInt(lotId);
      else srcWhere.lot_id = null;
      await this.prisma.inventory_on_hand.updateMany({
        where: srcWhere,
        data: { quantity_on_hand: { decrement: quantity } },
      });
    }

    // Increment destination location
    if (toLocationId) {
      const destWhere: any = {
        tenant_id: tenantId,
        facility_id: BigInt(facilityId),
        product_id: BigInt(productId),
        location_id: BigInt(toLocationId),
      };
      if (lotId) destWhere.lot_id = BigInt(lotId);
      else destWhere.lot_id = null;
      const existing = await this.prisma.inventory_on_hand.findFirst({
        where: destWhere,
      });

      if (existing) {
        await this.prisma.inventory_on_hand.updateMany({
          where: { on_hand_id: existing.on_hand_id },
          data: { quantity_on_hand: { increment: quantity } },
        });
      } else {
        await this.prisma.inventory_on_hand.create({
          data: {
            tenant_id: tenantId,
            facility_id: BigInt(facilityId),
            product_id: BigInt(productId),
            location_id: BigInt(toLocationId),
            lot_id: lotId ? BigInt(lotId) : undefined,
            quantity_on_hand: quantity,
            uom_id: dto.uomId ?? 1,
          },
        });
      }
    }

    return txn;
  }
}
