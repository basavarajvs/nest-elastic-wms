import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/cache/redis.constants';
import { CreateAdjustmentDto } from './dtos/adjustment.dto';

@Injectable()
export class InventoryAdjustmentService {
  private readonly logger = new Logger(InventoryAdjustmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private async getThresholdConfig(tenantId: string): Promise<any> {
    const cacheKey = `threshold_config:${tenantId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const result = await (this.prisma as any).approvalThresholdConfig.findFirst({
      where: { tenantId, active: true },
      orderBy: { appliedAt: 'desc' },
    });
    if (result) {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    }
    return result || { autoThreshold: 100, supervisorThreshold: 1000 };
  }

  async createDraft(dto: CreateAdjustmentDto, tenantId: string, userId: string): Promise<any> {
    const count = await (this.prisma as any).inventoryAdjustment.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const adjNumber = `ADJ-${dto.facilityId.slice(0, 8).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    return (this.prisma as any).inventoryAdjustment.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        adjustmentNumber: adjNumber,
        reasonCode: dto.reasonCode,
        notes: dto.notes,
        requestedByUserId: userId,
        status: 'DRAFT',
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: l.productId,
            locationId: l.locationId,
            lotId: l.lotId,
            quantityBefore: l.quantityBefore,
            quantityAdjustment: l.quantityAdjustment,
            quantityAfter: l.quantityAfter,
            uomId: l.uomId,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async submit(adjustmentId: string, tenantId: string): Promise<any> {
    const config = await this.getThresholdConfig(tenantId);
    const maxVariance = config?.autoThreshold ?? 100;
    const autoApproveReasons: string[] = ['CYCLE_COUNT', 'SYSTEM'];

    const adj = await (this.prisma as any).inventoryAdjustment.findFirst({
      where: { id: adjustmentId, tenantId },
      include: { lines: true },
    });
    if (!adj || adj.status !== 'DRAFT') throw new Error('Adjustment not found or not in DRAFT status');

    const maxLineVariance = Math.max(...adj.lines.map((l: any) => Math.abs(l.quantityAdjustment)));
    const shouldAutoApprove = maxLineVariance <= maxVariance && autoApproveReasons.includes(adj.reasonCode);

    const newStatus = shouldAutoApprove ? 'APPROVED' : 'PENDING_APPROVAL';

    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: newStatus },
      });

      if (!shouldAutoApprove) {
        await tx.adjustmentApproval.create({
          data: {
            tenantId,
            facilityId: adj.facilityId,
            varianceValue: maxLineVariance,
            varianceQty: maxLineVariance,
            approvalLevel: maxLineVariance <= (config?.supervisorThreshold ?? 1000) ? 'SUPERVISOR' : 'MANAGER',
            requestedByUserId: adj.requestedByUserId,
            status: 'PENDING',
            thresholdVersion: config?.version || '1.0',
          },
        });
      }

      return { id: adjustmentId, status: newStatus };
    });
  }

  async approve(adjustmentId: string, tenantId: string, userId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const adj = await tx.inventoryAdjustment.findFirst({
        where: { id: adjustmentId, tenantId, status: 'PENDING_APPROVAL' },
        include: { lines: true },
      });
      if (!adj) throw new Error('Adjustment not found or not in PENDING_APPROVAL status');

      await tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { status: 'APPROVED', approvedByUserId: userId },
      });

      for (const line of adj.lines) {
        const txnType = line.quantityAdjustment >= 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';
        const qty = Math.abs(line.quantityAdjustment);

        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            facilityId: adj.facilityId,
            productId: line.productId,
            locationId: line.locationId,
            lotId: line.lotId,
            transactionType: txnType,
            quantity: qty,
            quantityBefore: line.quantityBefore,
            quantityAfter: line.quantityAfter,
            uomId: line.uomId,
            referenceType: 'INVENTORY_ADJUSTMENT',
            referenceId: adjustmentId,
            reasonCode: adj.reasonCode,
            performedByUserId: userId,
          },
        });

        await tx.inventoryOnHand.updateMany({
          where: {
            tenantId,
            facilityId: adj.facilityId,
            productId: line.productId,
            locationId: line.locationId,
            lotId: line.lotId,
          },
          data: { quantityOnHand: { increment: line.quantityAdjustment } },
        });
      }
      return { id: adjustmentId, status: 'APPROVED' };
    });
  }

  async list(tenantId: string, filters: {
    status?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.facilityId) where.facilityId = filters.facilityId;

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 200);
    const [data, total] = await Promise.all([
      (this.prisma as any).inventoryAdjustment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).inventoryAdjustment.count({ where }),
    ]);
    return { data, total };
  }
}
