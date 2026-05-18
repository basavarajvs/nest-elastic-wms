import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { WmsNotificationClientService } from '../wms-notification-client.service';
import { WmsNotificationType } from '../wms-notification.types';

@Injectable()
export class InboundListener {
  private readonly logger = new Logger(InboundListener.name);

  constructor(
    private readonly client: WmsNotificationClientService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('asn.arrived')
  async handleAsnArrived(payload: {
    asnNumber: string;
    supplierName: string;
    expectedDate: string;
    itemCount: number;
    dockAssignment?: string;
    tenantId: string;
  }) {
    try {
      await this.client.dispatch({
        type: WmsNotificationType.ASN_ARRIVED,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'RECEIVING_SUPERVISOR' }],
        variables: {
          asnNumber: payload.asnNumber,
          supplierName: payload.supplierName,
          expectedDate: payload.expectedDate,
          itemCount: payload.itemCount,
          dockAssignment: payload.dockAssignment || '',
        },
        priority: 'normal',
      });
    } catch (err: any) {
      this.logger.error(`ASN arrived listener failed: ${err.message}`);
    }
  }

  @OnEvent('grn.completed')
  async handleGrnCompleted(payload: {
    grnId: string;
    tenantId: string;
    facilityId: string;
  }) {
    try {
      const grn = await (this.prisma as any).goodsReceipt.findFirst({
        where: { id: payload.grnId, tenantId: payload.tenantId },
        include: { lines: true },
      });

      await this.client.dispatch({
        type: WmsNotificationType.GRN_COMPLETED,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'INVENTORY_CLERK' }],
        variables: {
          grnNumber: grn?.grnNumber || payload.grnId,
          supplierName: grn?.vendorName || '',
          receivedQty: (grn?.lines || []).reduce(
            (sum: number, l: any) => sum + (l.receivedQuantity || 0),
            0,
          ),
          putawayQueueCount: (grn?.lines || []).filter(
            (l: any) => l.status === 'RECEIVED' || l.status === 'PENDING_PUTAWAY',
          ).length,
        },
        priority: 'normal',
      });
    } catch (err: any) {
      this.logger.error(`GRN completed listener failed: ${err.message}`);
    }
  }

  @OnEvent('qc.inspected')
  async handleQcInspected(payload: {
    grnLineId: string;
    result: string;
    tenantId: string;
  }) {
    try {
      if (payload.result !== 'FAILED' && payload.result !== 'REJECTED') return;

      await this.client.dispatch({
        type: WmsNotificationType.QC_FAILED,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'QC_MANAGER' }, { roleCode: 'PURCHASING_MANAGER' }],
        variables: {
          grnNumber: payload.grnLineId,
          supplierName: '',
          supplierLotNumber: '',
          defectCode: payload.result,
          qtyRejected: 0,
        },
        priority: 'high',
        bypassPreferences: true,
      });
    } catch (err: any) {
      this.logger.error(`QC failed listener failed: ${err.message}`);
    }
  }

  @OnEvent('putaway.completed')
  async handlePutawayDelayed(payload: {
    taskId: string;
    lpnId: string;
    tenantId: string;
  }) {
    try {
      await this.client.dispatch({
        type: WmsNotificationType.PUTAWAY_DELAYED,
        tenantId: payload.tenantId,
        recipients: [{ roleCode: 'WAREHOUSE_SUPERVISOR' }],
        variables: {
          taskId: payload.taskId,
          locationCode: '',
          delayMinutes: 0,
        },
        priority: 'low',
      });
    } catch (err: any) {
      this.logger.error(`Putaway delayed listener failed: ${err.message}`);
    }
  }
}
