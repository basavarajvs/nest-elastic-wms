import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StartSessionDto, ScanItemDto, SealContainerDto } from './dtos/packing.dto';

@Injectable()
export class PackingService {
  private readonly logger = new Logger(PackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async startSession(dto: StartSessionDto, userId: string, tenantId: string) {
    const station = await (this.prisma as any).packingStation.findFirst({
      where: { tenantId, facilityId: dto.facilityId, stationCode: dto.stationCode },
    });
    if (!station) throw new NotFoundException('Packing station not found');
    if (!station.isAvailable) throw new BadRequestException('Packing station is not available');

    const count = await (this.prisma as any).packingSession.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const sessionCode = `PS-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const session = await (this.prisma as any).packingSession.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        userId,
        stationCode: dto.stationCode,
        stationId: station.id,
        status: 'STATION_ASSIGNED',
        cartonsPacked: 0,
        itemsPacked: 0,
        cartons: {
          create: {
            tenantId,
            facilityId: dto.facilityId,
            containerCode: sessionCode,
            containerType: 'CARTON',
            status: 'ACTIVE',
          },
        },
      },
      include: { cartons: true },
    });

    await this.recordStatusHistory(session.id, 'STATION_ASSIGNED', 'STATION_ASSIGNED', userId, tenantId, 'Session started');
    return session;
  }

  async scanItem(sessionId: string, userId: string, tenantId: string, dto: ScanItemDto) {
    const session = await (this.prisma as any).packingSession.findFirst({
      where: { id: sessionId, tenantId },
      include: { cartons: true },
    });
    if (!session) throw new NotFoundException('Packing session not found');
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      throw new BadRequestException('Session is already closed');
    }

    const product = await (this.prisma as any).product.findFirst({
      where: { tenantId, productCode: dto.productCode },
    });
    if (!product) throw new NotFoundException('Product not found');

    let container;
    if (dto.containerId) {
      container = session.cartons.find((c: any) => c.id === dto.containerId);
      if (!container) throw new BadRequestException('Container not found in this session');
    } else {
      container = session.cartons.find((c: any) => c.status === 'ACTIVE');
      if (!container) {
        const count = session.cartons.length + 1;
        const containerCode = `${session.stationCode || 'PK'}-${count}`;
        container = await (this.prisma as any).packingContainer.create({
          data: {
            tenantId,
            facilityId: session.facilityId,
            sessionId,
            containerCode,
            containerType: 'CARTON',
            status: 'ACTIVE',
          },
        });
      }
    }

    const pickedLpns = container.pickedLpns || [];
    pickedLpns.push({
      productId: product.id,
      productCode: dto.productCode,
      productName: product.name,
      quantity: dto.quantity,
      lpn: dto.lpn || null,
      scannedAt: new Date().toISOString(),
      scannedBy: userId,
    });

    await (this.prisma as any).packingContainer.update({
      where: { id: container.id },
      data: { pickedLpns },
    });

    await (this.prisma as any).packingSession.update({
      where: { id: sessionId },
      data: {
        status: 'PACKING_ACTIVE',
        lastActivityAt: new Date(),
        itemsPacked: { increment: dto.quantity },
      },
    });

    return { containerId: container.id, containerCode: container.containerCode, productCode: dto.productCode, quantity: dto.quantity };
  }

  async sealContainer(sessionId: string, tenantId: string, dto: SealContainerDto) {
    const session = await (this.prisma as any).packingSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Packing session not found');

    const container = await (this.prisma as any).packingContainer.findFirst({
      where: { id: dto.containerId, sessionId, tenantId },
    });
    if (!container) throw new NotFoundException('Container not found in this session');
    if (container.status === 'SEALED') throw new BadRequestException('Container already sealed');

    await (this.prisma as any).packingContainer.update({
      where: { id: dto.containerId },
      data: { status: 'SEALED', weight: dto.weight || container.weight },
    });

    await (this.prisma as any).packingSession.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: new Date(),
        cartonsPacked: { increment: 1 },
      },
    });

    const nextCount = await (this.prisma as any).packingContainer.count({
      where: { sessionId, tenantId },
    });
    const nextContainerCode = `${session.stationCode || 'PK'}-${nextCount + 1}`;
    const nextContainer = await (this.prisma as any).packingContainer.create({
      data: {
        tenantId,
        facilityId: session.facilityId,
        sessionId,
        containerCode: nextContainerCode,
        containerType: 'CARTON',
        status: 'ACTIVE',
      },
    });

    return { sealedContainerId: dto.containerId, newContainerId: nextContainer.id, newContainerCode: nextContainer.containerCode };
  }

  async closeSession(sessionId: string, userId: string, tenantId: string) {
    const session = await (this.prisma as any).packingSession.findFirst({
      where: { id: sessionId, tenantId },
      include: { cartons: true },
    });
    if (!session) throw new NotFoundException('Packing session not found');
    if (session.status === 'COMPLETED') throw new BadRequestException('Session already closed');

    const activeContainers = session.cartons.filter((c: any) => c.status === 'ACTIVE');
    for (const c of activeContainers) {
      await (this.prisma as any).packingContainer.update({
        where: { id: c.id },
        data: { status: 'SEALED' },
      });
    }

    const sealedCount = await (this.prisma as any).packingContainer.count({
      where: { sessionId, tenantId, status: 'SEALED' },
    });

    await (this.prisma as any).packingSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endAt: new Date(),
        lastActivityAt: new Date(),
        cartonsPacked: sealedCount,
      },
    });

    await this.recordStatusHistory(sessionId, session.status, 'COMPLETED', userId, tenantId, 'Session closed');

    return { sessionId, cartonsPacked: sealedCount, itemsPacked: session.itemsPacked || 0 };
  }

  async getStatusHistory(sessionId: string, tenantId: string) {
    const session = await (this.prisma as any).packingSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Packing session not found');
    return (this.prisma as any).packingSessionStatusHistory.findMany({
      where: { sessionId, tenantId },
      orderBy: { changedAt: 'asc' },
    });
  }

  async getContainers(sessionId: string, tenantId: string) {
    const session = await (this.prisma as any).packingSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Packing session not found');
    return (this.prisma as any).packingContainer.findMany({
      where: { sessionId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyActiveSession(userId: string, tenantId: string) {
    return (this.prisma as any).packingSession.findFirst({
      where: { tenantId, userId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: { cartons: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async getShipmentStatusHistory(shipmentId: string, tenantId: string) {
    return (this.prisma as any).shipmentStatusHistory.findMany({
      where: { shipmentId, tenantId },
      orderBy: { changedAt: 'asc' },
    });
  }

  private async recordStatusHistory(
    sessionId: string, fromStatus: string, toStatus: string,
    changedBy: string, tenantId: string, reason?: string,
  ) {
    return (this.prisma as any).packingSessionStatusHistory.create({
      data: { tenantId, sessionId, fromStatus, toStatus, changedBy, reason },
    });
  }
}
