import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QcInspectDto, QcDispositionDto, QcRfResultDto } from './dtos/qc.dto';

@Injectable()
export class QcService {
  private readonly logger = new Logger(QcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async routeToQc(grnLineId: string, tenantId: string): Promise<any> {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id: grnLineId, tenantId },
    });
    if (!line) throw new BadRequestException('GRN line not found');

    return (this.prisma as any).goodsReceiptLine.update({
      where: { id: grnLineId },
      data: { qcResult: 'PENDING', status: 'QC_PENDING' },
    });
  }

  async inspect(dto: QcInspectDto, tenantId: string, userId?: string): Promise<any> {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id: dto.grnLineId, tenantId },
    });
    if (!line) throw new BadRequestException('GRN line not found');

    return (this.prisma as any).$transaction(async (tx: any) => {
      if (dto.qcResult === 'PASSED') {
        await tx.goodsReceiptLine.update({
          where: { id: dto.grnLineId },
          data: { qcResult: 'PASSED', status: 'PUTAWAY_PENDING', disposition: 'ACCEPT' },
        });
        await tx.lPN.updateMany({
          where: { grnLineId: dto.grnLineId, tenantId, status: 'IN_QC' },
          data: { status: 'PUTAWAY_PENDING' },
        });
      } else {
        await tx.goodsReceiptLine.update({
          where: { id: dto.grnLineId },
          data: { qcResult: 'FAILED', status: 'QC_FAILED', disposition: 'QUARANTINE' },
        });
        await tx.lPN.updateMany({
          where: { grnLineId: dto.grnLineId, tenantId, status: 'IN_QC' },
          data: { status: 'QUARANTINED' },
        });
      }

      await tx.inspection.create({
        data: {
          tenantId,
          facilityId: line.facilityId,
          grnLineId: dto.grnLineId,
          inspectorUserId: userId || 'SYSTEM',
          result: dto.qcResult,
          notes: dto.notes,
        },
      });

      this.eventEmitter.emit('qc.inspected', { grnLineId: dto.grnLineId, result: dto.qcResult, tenantId });
      return { qcResult: dto.qcResult, status: dto.qcResult === 'PASSED' ? 'PUTAWAY_PENDING' : 'QC_FAILED' };
    });
  }

  async applyDisposition(dto: QcDispositionDto, tenantId: string, userId?: string): Promise<any> {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id: dto.grnLineId, tenantId },
    });
    if (!line) throw new BadRequestException('GRN line not found');

    return (this.prisma as any).$transaction(async (tx: any) => {
      const result: any = { disposition: dto.action };
      if (dto.action === 'QUARANTINE') {
        await tx.lPN.updateMany({
          where: { grnLineId: dto.grnLineId, tenantId },
          data: { status: 'QUARANTINED' },
        });
        result.status = 'QC_FAILED';
      } else if (dto.action === 'RETURN_TO_VENDOR' || dto.action === 'DESTROY') {
        result.status = 'QC_FAILED';
      } else if (dto.action === 'ACCEPT') {
        result.status = 'PUTAWAY_PENDING';
      }

      await tx.qcDisposition.create({
        data: {
          tenantId,
          facilityId: line.facilityId,
          grnLineId: dto.grnLineId,
          action: dto.action,
          notes: dto.notes,
          appliedByUserId: userId || 'SYSTEM',
        },
      });

      return tx.goodsReceiptLine.update({
        where: { id: dto.grnLineId },
        data: result,
      });
    });
  }

  async rfInspect(dto: QcRfResultDto, tenantId: string, userId?: string): Promise<any> {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { lpnNumber: dto.lpnNumber, tenantId },
    });
    if (!lpn || !lpn.grnLineId) throw new BadRequestException('LPN not found or not linked to a GRN line');

    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id: lpn.grnLineId, tenantId },
    });
    if (!line) throw new BadRequestException('GRN line not found');

    return this.inspect({ grnLineId: line.id, qcResult: dto.result, notes: dto.notes }, tenantId, userId);
  }
}
