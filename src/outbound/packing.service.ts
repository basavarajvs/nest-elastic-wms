import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StartPackingDto, ScanLpnToContainerDto, SealContainerDto } from './dtos/packing.dto';

@Injectable()
export class PackingService {
  private readonly logger = new Logger(PackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startSession(dto: StartPackingDto, tenantId: string): Promise<any> {
    const session = await (this.prisma as any).packingSession.create({
      data: {
        tenantId,
        facilityId: '',
        userId: dto.userId,
        stationCode: dto.stationCode,
        status: 'PACKING_ACTIVE',
      },
    });
    return session;
  }

  async scanIntoContainer(dto: ScanLpnToContainerDto, tenantId: string): Promise<any> {
    const lpn = await (this.prisma as any).lPN.findFirst({
      where: { id: dto.lpnId, tenantId },
    });
    if (!lpn) throw new BadRequestException('LPN not found');
    if (!['PICKED', 'CONSUMED'].includes(lpn.status)) {
      throw new BadRequestException('LPN is not in a pickable state');
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      let container = await tx.packingContainer.findFirst({
        where: { containerCode: dto.containerCode, tenantId },
      });

      const existingLpns = (container?.pickedLpns as any[]) || [];
      existingLpns.push({
        lpnId: dto.lpnId,
        lpnNumber: lpn.lpnNumber,
        productId: lpn.productId,
        quantity: lpn.quantity,
      });

      if (!container) {
        const count = await tx.packingContainer.count({ where: { tenantId } });
        container = await tx.packingContainer.create({
          data: {
            tenantId,
            facilityId: '',
            sessionId: dto.sessionId,
            containerCode: dto.containerCode,
            containerType: 'CARTON',
            pickedLpns: existingLpns,
          },
        });
      } else {
        container = await tx.packingContainer.update({
          where: { id: container.id },
          data: { pickedLpns: existingLpns },
        });
      }

      return container;
    });
  }

  async sealContainer(dto: SealContainerDto, tenantId: string): Promise<any> {
    return (this.prisma as any).packingContainer.update({
      where: { id: dto.containerId },
      data: {
        status: 'SEALED',
        weight: dto.weight,
      },
    });
  }

  async closeSession(sessionId: string, tenantId: string): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const session = await tx.packingSession.findFirst({
        where: { id: sessionId, tenantId },
        include: { cartons: { where: { status: 'SEALED' } } },
      });
      if (!session) throw new BadRequestException('Session not found');

      // Collect order-line level data from sealed containers
      const orderLineContainers: Record<string, { containerCodes: string[]; qtyShipped: number }> = {};
      for (const carton of session.cartons) {
        const pickedLpns = (carton.pickedLpns as any[]) || [];
        for (const lpn of pickedLpns) {
          const lineId = lpn.orderLineId || 'unknown';
          if (!orderLineContainers[lineId]) {
            orderLineContainers[lineId] = { containerCodes: [], qtyShipped: 0 };
          }
          if (!orderLineContainers[lineId].containerCodes.includes(carton.containerCode)) {
            orderLineContainers[lineId].containerCodes.push(carton.containerCode);
          }
          orderLineContainers[lineId].qtyShipped += Number(lpn.quantity || 0);
        }
      }

      await tx.packingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endAt: new Date() },
      });

      for (const carton of session.cartons) {
        const shipmentCount = await tx.outboundShipment.count({ where: { tenantId } });
        const shipmentNumber = `SHP-${(shipmentCount + 1).toString().padStart(6, '0')}`;

        await tx.outboundShipment.create({
          data: {
            tenantId,
            facilityId: session.facilityId,
            shipmentNumber,
            status: 'CREATED',
            containers: [carton.containerCode],
            orderLineShipments: orderLineContainers,
          },
        });
      }

      this.eventEmitter.emit('packing.session_closed', { sessionId, shipments: session.cartons.length, tenantId });
      return { status: 'COMPLETED', shipmentsGenerated: session.cartons.length, orderLines: Object.keys(orderLineContainers).length };
    });
  }
}
