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
      facility_id: BigInt(dto.facility_id),
      asn_number: dto.asn_number,
      vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : undefined,
      po_number: dto.po_number,
      carrier_name: dto.carrier_name,
      tracking_number: dto.tracking_number,
      shipment_date: dto.shipment_date ? new Date(dto.shipment_date) : undefined,
      expected_arrival_date: dto.expected_arrival_date ? new Date(dto.expected_arrival_date) : undefined,
      actual_arrival_date: dto.actual_arrival_date ? new Date(dto.actual_arrival_date) : undefined,
      weight: dto.weight,
      volume: dto.volume,
      notes: dto.notes,
      inbound_for_client_id: dto.inbound_for_client_id ? BigInt(dto.inbound_for_client_id) : undefined,
    };

    const asn = await this.prisma.advance_ship_notices.create({ data });

    if (dto.lines && dto.lines.length > 0) {
      await this.prisma.asn_lines.createMany({
        data: dto.lines.map((line: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facility_id),
          asn_id: asn.asn_id,
          product_id: BigInt(line.product_id),
          expected_quantity: line.expected_quantity,
          uom_id: BigInt(line.uom_id),
          lot_number: line.lot_number,
          serial_numbers_json: line.serial_numbers_json,
          expiry_date: line.expiry_date ? new Date(line.expiry_date) : undefined,
          notes: line.notes,
        })),
      });
    }

    return this.findById(tenantId, asn.asn_id);
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.advance_ship_notices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expected_arrival_date: 'asc' },
      }),
      this.prisma.advance_ship_notices.count({ where }),
    ]);
    return { data: await this.enrichAsnsWithNames(data), total, page, limit };
  }

  async findById(tenantId: string, asnId: bigint) {
    const asn = await this.prisma.advance_ship_notices.findFirst({
      where: { tenant_id: tenantId, asn_id: asnId },
    });
    return this.enrichAsnWithNames(asn);
  }

  async update(tenantId: string, asnId: bigint, dto: any) {
    await this.prisma.advance_ship_notices.updateMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      data: {
        carrier_name: dto.carrier_name,
        tracking_number: dto.tracking_number,
        expected_arrival_date: dto.expected_arrival_date ? new Date(dto.expected_arrival_date) : undefined,
        actual_arrival_date: dto.actual_arrival_date ? new Date(dto.actual_arrival_date) : undefined,
        notes: dto.notes,
      },
    });
    return this.findById(tenantId, asnId);
  }

  async updateStatus(tenantId: string, asnId: bigint, status: asn_status, changedBy?: string) {
    await this.prisma.advance_ship_notices.updateMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      data: {
        status,
        status_changed_at: new Date(),
        status_changed_by: changedBy ? BigInt(changedBy) : undefined,
      },
    });
    return this.findById(tenantId, asnId);
  }

  async delete(tenantId: string, asnId: bigint) {
    return this.prisma.advance_ship_notices.deleteMany({
      where: { tenant_id: tenantId, asn_id: asnId },
    });
  }

  async findLines(tenantId: string, asnId: bigint) {
    const lines = await this.prisma.asn_lines.findMany({
      where: { tenant_id: tenantId, asn_id: asnId },
      orderBy: { asn_line_id: 'asc' },
    });
    return this.enrichLinesWithNames(lines);
  }

  private async enrichAsnsWithNames(asns: any[]): Promise<any[]> {
    if (!asns.length) return asns;
    const tenantId = asns[0].tenant_id;
    const facilityIds = [...new Set(asns.map(a => a.facility_id).filter(Boolean))];
    const vendorIds = [...new Set(asns.map(a => a.vendor_id).filter(Boolean))];
    const clientIds = [...new Set(asns.map(a => a.inbound_for_client_id).filter(Boolean))];
    const [facilities, vendors, clients] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }) : [],
      vendorIds.length ? this.prisma.vendors.findMany({ where: { tenant_id: tenantId, vendor_id: { in: vendorIds } } }) : [],
      clientIds.length ? this.prisma.clients.findMany({ where: { tenant_id: tenantId, client_id: { in: clientIds } } }) : [],
    ]) as [any[], any[], any[]];
    const facMap = new Map<string, string>();
    facilities.forEach(f => facMap.set(String(f.facility_id), f.facility_name));
    const vendorMap = new Map<string, string>();
    vendors.forEach(v => vendorMap.set(String(v.vendor_id), v.vendor_name));
    const clientMap = new Map<string, string>();
    clients.forEach(c => clientMap.set(String(c.client_id), c.client_name));
    return asns.map(a => ({
      ...a,
      facility_name: facMap.get(String(a.facility_id)) ?? null,
      vendor_name: vendorMap.get(String(a.vendor_id)) ?? null,
      client_name: clientMap.get(String(a.inbound_for_client_id)) ?? null,
    }));
  }

  private async enrichAsnWithNames(asn: any): Promise<any> {
    if (!asn) return asn;
    const [asns] = await this.enrichAsnsWithNames([asn]);
    return asns;
  }

  private async enrichLinesWithNames(lines: any[]): Promise<any[]> {
    if (!lines.length) return lines;
    const tenantId = lines[0].tenant_id;
    const facilityIds = [...new Set(lines.map(l => l.facility_id).filter(Boolean))];
    const productIds = [...new Set(lines.map(l => l.product_id).filter(Boolean))];
    const uomIds = [...new Set(lines.map(l => l.uom_id).filter(Boolean))];
    const [facilities, products, uoms] = await Promise.all([
      facilityIds.length ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }) : [],
      productIds.length ? this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } }) : [],
      uomIds.length ? this.prisma.units_of_measure.findMany({ where: { tenant_id: tenantId, uom_id: { in: uomIds } } }) : [],
    ]) as [any[], any[], any[]];
    const facMap = new Map<string, string>();
    facilities.forEach(f => facMap.set(String(f.facility_id), f.facility_name));
    const prodMap = new Map<string, string>();
    products.forEach(p => prodMap.set(String(p.product_id), p.product_name));
    const uomMap = new Map<string, string>();
    uoms.forEach(u => uomMap.set(String(u.uom_id), u.uom_name));
    return lines.map(l => ({
      ...l,
      facility_name: facMap.get(String(l.facility_id)) ?? null,
      product_name: prodMap.get(String(l.product_id)) ?? null,
      uom_name: uomMap.get(String(l.uom_id)) ?? null,
    }));
  }
}
