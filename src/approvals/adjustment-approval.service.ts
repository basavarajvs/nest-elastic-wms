import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApproveApprovalDto, RejectApprovalDto } from './dtos/approval.dto';

@Injectable()
export class AdjustmentApprovalService {
  private readonly logger = new Logger(AdjustmentApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async routeForApproval(approvalId: string, tenantId: string): Promise<any> {
    const approval = await (this.prisma as any).adjustmentApproval.findFirst({
      where: { id: approvalId, tenantId },
    });
    if (!approval) throw new BadRequestException('Approval not found');

    const updated = await (this.prisma as any).adjustmentApproval.update({
      where: { id: approvalId },
      data: { status: 'PENDING' },
    });

    this.eventEmitter.emit('approval.requested', { approvalId, level: approval.approvalLevel, tenantId });
    return updated;
  }

  async approve(approvalId: string, dto: ApproveApprovalDto, tenantId: string, userId: string): Promise<any> {
    const approval = await (this.prisma as any).adjustmentApproval.findFirst({
      where: { id: approvalId, tenantId, status: 'PENDING' },
    });
    if (!approval) throw new BadRequestException('Approval not found or not in PENDING status');

    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.adjustmentApproval.update({
        where: { id: approvalId },
        data: { status: 'APPROVED', approvedByUserId: userId, comments: dto.comments },
      });

      if (approval.countLineId) {
        const line = await tx.cycleCountLine.findFirst({
          where: { id: approval.countLineId, tenantId },
        });
        if (line) {
          const variance = (line.countedQuantity || 0) - line.systemQuantity;
          const txnType = variance > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';

          await tx.inventoryTransaction.create({
            data: {
              tenantId,
              facilityId: approval.facilityId,
              productId: line.productId,
              locationId: line.locationId,
              lotId: line.lotId,
              transactionType: txnType,
              quantity: Math.abs(variance),
              quantityBefore: line.systemQuantity,
              quantityAfter: line.countedQuantity || 0,
              uomId: line.uomId,
              referenceType: 'CYCLE_COUNT_APPROVED',
              referenceId: approval.id,
              reasonCode: 'APPROVED_ADJUSTMENT',
            },
          });

          await tx.inventoryOnHand.updateMany({
            where: { tenantId, facilityId: line.facilityId, productId: line.productId, locationId: line.locationId },
            data: { quantityOnHand: { increment: variance } },
          });
        }
      }

      return { status: 'APPROVED' };
    });
  }

  async reject(approvalId: string, dto: RejectApprovalDto, tenantId: string): Promise<any> {
    const approval = await (this.prisma as any).adjustmentApproval.findFirst({
      where: { id: approvalId, tenantId },
    });
    if (!approval) throw new BadRequestException('Approval not found');

    return (this.prisma as any).adjustmentApproval.update({
      where: { id: approvalId },
      data: { status: 'REJECTED', rejectionReason: dto.reason },
    });
  }

  async getPending(tenantId: string, facilityId?: string): Promise<any[]> {
    const where: any = { tenantId, status: 'PENDING' };
    if (facilityId) where.facilityId = facilityId;
    return (this.prisma as any).adjustmentApproval.findMany({
      where,
      orderBy: { varianceValue: 'desc' },
    });
  }

  async autoApprove(): Promise<void> {
    const pendingAuto = await (this.prisma as any).adjustmentApproval.findMany({
      where: { status: 'PENDING', approvalLevel: 'AUTO_APPROVED' },
    });

    for (const approval of pendingAuto) {
      try {
        await (this.prisma as any).$transaction(async (tx: any) => {
          await tx.adjustmentApproval.update({
            where: { id: approval.id },
            data: { status: 'APPROVED', approvedByUserId: 'SYSTEM', comments: 'Auto-approved by system' },
          });

          if (approval.countLineId) {
            const line = await tx.cycleCountLine.findFirst({
              where: { id: approval.countLineId, tenantId: approval.tenantId },
            });
            if (line) {
              const variance = (line.countedQuantity || 0) - line.systemQuantity;
              const txnType = variance > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';
              await tx.inventoryTransaction.create({
                data: {
                  tenantId: approval.tenantId,
                  facilityId: approval.facilityId,
                  productId: line.productId,
                  locationId: line.locationId,
                  lotId: line.lotId,
                  transactionType: txnType,
                  quantity: Math.abs(variance),
                  quantityBefore: line.systemQuantity,
                  quantityAfter: line.countedQuantity || 0,
                  uomId: line.uomId,
                  referenceType: 'AUTO_ADJUSTMENT',
                  referenceId: approval.id,
                  reasonCode: 'AUTO_APPROVED',
                },
              });
            }
          }
        });
      } catch (err: any) {
        this.logger.error(`Auto-approve failed for ${approval.id}: ${err.message}`);
      }
    }
  }
}
