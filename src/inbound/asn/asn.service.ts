import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { asn_status } from '@prisma/client';

@Injectable()
export class AsnService {
  private readonly logger = new Logger(AsnService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facilityId),
      asn_number: dto.asnNumber,
      vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
      po_number: dto.poNumber,
      carrier_name: dto.carrierName,
      tracking_number: dto.trackingNumber,
      shipment_date: dto.shipmentDate ? new Date(dto.shipmentDate) : undefined,
      expected_arrival_date: dto.expectedArrivalDate ? new Date(dto.expectedArrivalDate) : undefined,
      weight: dto.weight,
      volume: dto.volume,
      notes: dto.notes,
      inbound_for_client_id: dto.inboundForClientId ? BigInt(dto.inboundForClientId) : undefined,
    };

    if (dto.lines && dto.lines.length > 0) {
      data.asn_lines = {
        create: dto.lines.map((line: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facilityId),
          product_id: BigInt(line.productId),
          expected_quantity: line.expectedQuantity,
          uom_id: BigInt(line.uomId),
          lot_number: line.lotNumber,
          expiry_date: line.expiryDate ? new Date(line.expiryDate) : undefined,
          notes: line.notes,
        })),
      };
    }

    return this.prisma.advance_ship_notices.create({ data });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { asn_number: { contains: query.search, mode: 'insensitive' } },
        { po_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.advance_ship_notices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expected_arrival_date: 'asc' },
      }),
      this.prisma.advance_ship_notices.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, asnId: bigint) {
    return this.prisma.advance_ship_notices.findFirst({
      where: { tenant_id: tenantId, asn_id: asnId },
    });
  }

  async update(tenantId: string, asnId: bigint, dto: any) {
    return this.prisma.advance_ship_notices.updateMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      data: {
        carrier_name: dto.carrierName,
        tracking_number: dto.trackingNumber,
        expected_arrival_date: dto.expectedArrivalDate ? new Date(dto.expectedArrivalDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  async updateStatus(tenantId: string, asnId: bigint, status: asn_status, changedBy?: string) {
    return this.prisma.advance_ship_notices.updateMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      data: {
        status,
        status_changed_at: new Date(),
        status_changed_by: changedBy ? BigInt(changedBy) : undefined,
      },
    });
  }

  async delete(tenantId: string, asnId: bigint) {
    return this.prisma.advance_ship_notices.deleteMany({
      where: { tenant_id: tenantId, asn_id: asnId },
    });
  }

  async findLines(tenantId: string, asnId: bigint) {
    return this.prisma.asn_lines.findMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      orderBy: { asn_line_id: 'asc' },
    });
  }
}
