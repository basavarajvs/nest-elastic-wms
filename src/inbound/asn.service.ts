import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAsnDto } from './dtos/asn.dto';

const ASN_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_RECEIVING', 'CANCELLED'],
  IN_RECEIVING: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['IN_RECEIVING', 'RECEIVED', 'CANCELLED'],
  RECEIVED: ['CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class AsnService {
  private readonly logger = new Logger(AsnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateAsnDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).advanceShipNotice.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const now = new Date();
    const asnNumber = `ASN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

    return (this.prisma as any).advanceShipNotice.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        asnNumber,
        vendorId: dto.vendorId,
        poNumber: dto.poNumber,
        status: 'CREATED',
        carrierName: dto.carrierName,
        trackingNumber: dto.trackingNumber,
        expectedArrivalDate: dto.expectedArrivalDate ? new Date(dto.expectedArrivalDate) : null,
        notes: dto.notes,
        lines: {
          create: dto.lines.map((l) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: l.productId,
            expectedQuantity: l.expectedQuantity,
            uomId: l.uomId,
            lotNumber: l.lotNumber,
            expiryDate: l.expiryDate ? new Date(l.expiryDate) : null,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateStatus(asnId: string, newStatus: string, tenantId: string): Promise<any> {
    const asn = await (this.prisma as any).advanceShipNotice.findFirst({
      where: { id: asnId, tenantId },
    });
    if (!asn) throw new BadRequestException('ASN not found');

    const allowed = ASN_TRANSITIONS[asn.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${asn.status} to ${newStatus}`,
      );
    }
    const updateData: any = { status: newStatus };
    if (newStatus === 'ARRIVED') updateData.actualArrivalDate = new Date();

    return (this.prisma as any).advanceShipNotice.update({
      where: { id: asnId },
      data: updateData,
    });
  }

  async previewReceive(asnId: string, tenantId: string): Promise<any> {
    const asn = await (this.prisma as any).advanceShipNotice.findFirst({
      where: { id: asnId, tenantId },
      include: {
        lines: true,
      },
    });
    if (!asn) throw new BadRequestException('ASN not found');

    const lines = asn.lines.map((l: any) => ({
      lineId: l.id,
      productId: l.productId,
      expectedQuantity: l.expectedQuantity,
      receivedQuantity: l.receivedQuantity,
      remaining: Math.max(0, l.expectedQuantity - l.receivedQuantity),
      status: l.status,
    }));

    return {
      asnNumber: asn.asnNumber,
      status: asn.status,
      totalLines: lines.length,
      fullyReceived: lines.filter((l: any) => l.remaining === 0).length,
      lines,
    };
  }
}
