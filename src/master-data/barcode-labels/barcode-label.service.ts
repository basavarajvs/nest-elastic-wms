import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BarcodeLabelService {
  constructor(private readonly prisma: PrismaService) {}

  private flattenLabel(label: any) {
    if (!label) return null;
    return {
      ...label,
      facility_name: label.warehouse_facilities?.facility_name,
      warehouse_facilities: undefined,
    };
  }

  async generate(tenantId: string, dto: any) {
    const labelNumber = `LBL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const label = await this.prisma.barcode_labels.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facility_id ? BigInt(dto.facility_id) : undefined,
        label_number: labelNumber,
        barcode_value: dto.barcode_value,
        label_type: dto.label_type,
        label_format: dto.label_format ?? 'CODE128',
        entity_type: dto.entity_type,
        entity_id: BigInt(dto.entity_id),
        entity_reference: dto.entity_reference,
        label_data_json: dto.label_data_json,
        human_readable_text: dto.human_readable_text,
        label_template_name: dto.label_template_name,
        label_size_mm: dto.label_size_mm,
        label_format_file: dto.label_format_file,
        is_active: true,
        created_by: dto.created_by ? BigInt(dto.created_by) : undefined,
      },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return this.flattenLabel(label);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_active: true };
    if (query.labelType) where.label_type = query.labelType;
    if (query.entityType) where.entity_type = query.entityType;
    if (query.entityId) where.entity_id = BigInt(query.entityId);
    if (query.printStatus) where.print_status = query.printStatus;
    if (query.search) {
      where.OR = [
        { label_number: { contains: query.search, mode: 'insensitive' } },
        { barcode_value: { contains: query.search, mode: 'insensitive' } },
        { entity_reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.barcode_labels.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          warehouse_facilities: { select: { facility_name: true } },
        },
      }),
      this.prisma.barcode_labels.count({ where }),
    ]);
    return { data: data.map((l) => this.flattenLabel(l)), total, page, limit };
  }

  async findById(tenantId: string, labelId: bigint) {
    const label = await this.prisma.barcode_labels.findFirst({
      where: { tenant_id: tenantId, label_id: labelId },
      include: {
        warehouse_facilities: { select: { facility_name: true } },
      },
    });
    return this.flattenLabel(label);
  }

  async delete(tenantId: string, labelId: bigint) {
    const record = await this.findById(tenantId, labelId);
    await this.prisma.barcode_labels.deleteMany({
      where: { tenant_id: tenantId, label_id: labelId },
    });
    return record;
  }

  async updatePrintStatus(tenantId: string, labelId: bigint, dto: { printStatus: string; printedBy?: bigint }) {
    await this.prisma.barcode_labels.updateMany({
      where: { tenant_id: tenantId, label_id: labelId },
      data: {
        print_status: dto.printStatus,
        printed_at: new Date(),
        printed_by: dto.printedBy,
        print_count: { increment: 1 },
      },
    });
    return this.findById(tenantId, labelId);
  }
}
