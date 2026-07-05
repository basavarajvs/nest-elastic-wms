import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BarcodeLabelService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, dto: any) {
    const labelNumber = `LBL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return this.prisma.barcode_labels.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facilityId ? BigInt(dto.facilityId) : undefined,
        label_number: labelNumber,
        barcode_value: dto.barcodeValue,
        label_type: dto.labelType,
        label_format: dto.labelFormat ?? 'CODE128',
        entity_type: dto.entityType,
        entity_id: BigInt(dto.entityId),
        entity_reference: dto.entityReference,
        label_data_json: dto.labelDataJson,
        human_readable_text: dto.humanReadableText,
        label_template_name: dto.labelTemplateName,
        label_size_mm: dto.labelSizeMm,
        label_format_file: dto.labelFormatFile,
        is_active: true,
        created_by: dto.createdBy ? BigInt(dto.createdBy) : undefined,
      },
    });
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
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.barcode_labels.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.barcode_labels.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, labelId: bigint) {
    return this.prisma.barcode_labels.findFirst({
      where: { tenant_id: tenantId, label_id: labelId },
    });
  }

  async delete(tenantId: string, labelId: bigint) {
    return this.prisma.barcode_labels.deleteMany({
      where: { tenant_id: tenantId, label_id: labelId },
    });
  }

  async updatePrintStatus(tenantId: string, labelId: bigint, dto: { printStatus: string; printedBy?: bigint }) {
    return this.prisma.barcode_labels.updateMany({
      where: { tenant_id: tenantId, label_id: labelId },
      data: {
        print_status: dto.printStatus,
        printed_at: new Date(),
        printed_by: dto.printedBy,
        print_count: { increment: 1 },
      },
    });
  }
}
