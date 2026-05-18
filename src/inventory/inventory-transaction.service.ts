import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { CreateTransactionDto } from './dtos/transaction.dto';

@Injectable()
export class InventoryTransactionService {
  private readonly logger = new Logger(InventoryTransactionService.name);
  private readonly LOCK_TTL = 500;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async executeTransaction(dto: CreateTransactionDto, tenantId: string): Promise<any> {
    const lotId = dto.lotId || '00000000-0000-0000-0000-000000000000';
    const lockKey = `inv:lock:${dto.productId}:${lotId}`;
    const lock = await this.redis.set(lockKey, '1', 'PX', this.LOCK_TTL, 'NX');
    if (!lock) {
      throw new Error('Concurrent transaction in progress for this product/lot');
    }
    try {
      const result = await (this.prisma as any).$transaction(async (tx: any) => {
        let qtyBefore = 0;
        let qtyAfter = 0;
        if (dto.locationId && dto.lotId) {
          const onHand = await tx.inventoryOnHand.findFirst({
            where: {
              tenantId,
              facilityId: dto.facilityId,
              locationId: dto.locationId,
              lotId,
              productId: dto.productId,
            },
          });
          qtyBefore = onHand?.quantityOnHand ?? 0;
          const qtyDelta = this.signQuantity(dto.transactionType) * dto.quantity;
          qtyAfter = Math.max(0, qtyBefore + qtyDelta);

          const txnTypes: string[] = ['PICK', 'SHIP', 'ADJUSTMENT_DECREASE', 'TRANSFER_OUT', 'SCRAPP'];
          if (qtyDelta < 0 && txnTypes.includes(dto.transactionType)) {
            const updated = await tx.inventoryOnHand.updateMany({
              where: {
                tenantId,
                facilityId: dto.facilityId,
                locationId: dto.locationId,
                lotId,
                productId: dto.productId,
                quantityOnHand: { gte: Math.abs(dto.quantity) },
              },
              data: { quantityOnHand: { increment: qtyDelta } },
            });
            if (updated.count === 0) {
              throw new Error('Insufficient quantity on hand');
            }
          } else {
            await tx.inventoryOnHand.upsert({
              where: {
                inventory_on_hand_uq: {
                  tenantId,
                  facilityId: dto.facilityId,
                  productId: dto.productId,
                  locationId: dto.locationId,
                  lotId,
                },
              },
              update: { quantityOnHand: { increment: qtyDelta } },
              create: {
                tenantId,
                facilityId: dto.facilityId,
                productId: dto.productId,
                locationId: dto.locationId,
                lotId,
                quantityOnHand: qtyAfter,
                uomId: dto.uomId,
              },
            });
          }
        }

        const txn = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            facilityId: dto.facilityId,
            productId: dto.productId,
            locationId: dto.locationId,
            locationIdTo: dto.locationIdTo,
            lotId,
            transactionType: dto.transactionType,
            quantity: dto.quantity,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            uomId: dto.uomId,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            reasonCode: dto.reasonCode,
            performedByUserId: dto.performedByUserId,
            metadata: dto.metadata || undefined,
          },
        });

        if (dto.locationId && dto.lotId) {
          this.redis.del(`inv:availability:${dto.productId}:${dto.facilityId}`);
        }
        return txn;
      });
      return result;
    } finally {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.redis.eval(script, 1, lockKey, '1').catch(() => {});
    }
  }

  private signQuantity(txnType: string): number {
    const decrementing: string[] = [
      'PICK', 'SHIP', 'ADJUSTMENT_DECREASE', 'TRANSFER_OUT',
      'CYCLE_COUNT_RESERVE', 'HOLD_RELEASE', 'QC_FAIL', 'SCRAPP',
    ];
    return decrementing.includes(txnType) ? -1 : 1;
  }

  async findByReference(tenantId: string, referenceType: string, referenceId: string): Promise<any[]> {
    return (this.prisma as any).inventoryTransaction.findMany({
      where: { tenantId, referenceType, referenceId },
      orderBy: { transactionAt: 'desc' },
    });
  }
}
