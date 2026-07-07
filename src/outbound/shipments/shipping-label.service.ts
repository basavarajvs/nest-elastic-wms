import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShippingLabelService {
  private readonly logger = new Logger(ShippingLabelService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.shipping_labels.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        shipment_id: BigInt(dto.shipment_id),
        tracking_number: dto.tracking_number,
        label_data_url: dto.label_data_url,
        label_format: dto.label_format ?? 'PDF',
        service_level: dto.service_level,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        shipping_cost: dto.shipping_cost,
        currency_code: dto.currency_code,
        status: dto.status ?? 'GENERATED',
        printed_at: dto.printed_at ? new Date(dto.printed_at) : undefined,
        applied_to_shipment_at: dto.applied_to_shipment_at ? new Date(dto.applied_to_shipment_at) : undefined,
        carrier_confirmation_number: dto.carrier_confirmation_number,
        carrier_picked_up_at: dto.carrier_picked_up_at ? new Date(dto.carrier_picked_up_at) : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facility_id) where.facility_id = BigInt(query.facility_id);
    if (query.shipment_id) where.shipment_id = BigInt(query.shipment_id);
    if (query.status) where.status = query.status;
    if (query.tracking_number) where.tracking_number = { contains: query.tracking_number, mode: 'insensitive' };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.shipping_labels.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { generated_at: 'desc' },
      }),
      this.prisma.shipping_labels.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.shipping_labels.findFirst({
      where: { tenant_id: tenantId, label_id: id },
    });
    if (!row) throw new NotFoundException('Shipping label not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.tracking_number !== undefined) data.tracking_number = dto.tracking_number;
    if (dto.label_data_url !== undefined) data.label_data_url = dto.label_data_url;
    if (dto.label_format !== undefined) data.label_format = dto.label_format;
    if (dto.service_level !== undefined) data.service_level = dto.service_level;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.shipping_cost !== undefined) data.shipping_cost = dto.shipping_cost;
    if (dto.currency_code !== undefined) data.currency_code = dto.currency_code;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.printed_at !== undefined) data.printed_at = dto.printed_at ? new Date(dto.printed_at) : null;
    if (dto.applied_to_shipment_at !== undefined) data.applied_to_shipment_at = dto.applied_to_shipment_at ? new Date(dto.applied_to_shipment_at) : null;
    if (dto.carrier_confirmation_number !== undefined) data.carrier_confirmation_number = dto.carrier_confirmation_number;
    if (dto.carrier_picked_up_at !== undefined) data.carrier_picked_up_at = dto.carrier_picked_up_at ? new Date(dto.carrier_picked_up_at) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.shipping_labels.update({
      where: { label_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.shipping_labels.deleteMany({
      where: { tenant_id: tenantId, label_id: id },
    });
    return row;
  }
}
