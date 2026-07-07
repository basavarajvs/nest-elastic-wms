import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductAttributeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_attributes.create({
      data: {
        tenant_id: tenantId,
        attribute_name: dto.attribute_name,
        attribute_code: dto.attribute_code,
        attribute_type: dto.attribute_type,
        allowed_values: dto.allowed_values,
        is_required: dto.is_required ?? false,
        is_searchable: dto.is_searchable ?? false,
        description: dto.description,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.isSearchable !== undefined) where.is_searchable = query.isSearchable;
    if (query.attributeType) where.attribute_type = query.attributeType;
    if (query.search) {
      where.OR = [
        { attribute_name: { contains: query.search, mode: 'insensitive' } },
        { attribute_code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.product_attributes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { attribute_name: 'asc' },
      }),
      this.prisma.product_attributes.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, attributeId: bigint) {
    return this.prisma.product_attributes.findFirst({
      where: { tenant_id: tenantId, attribute_id: attributeId },
    });
  }

  async update(tenantId: string, attributeId: bigint, dto: any) {
    const data: any = {};
    if (dto.attribute_name !== undefined) data.attribute_name = dto.attribute_name;
    if (dto.attribute_code !== undefined) data.attribute_code = dto.attribute_code;
    if (dto.attribute_type !== undefined) data.attribute_type = dto.attribute_type;
    if (dto.allowed_values !== undefined) data.allowed_values = dto.allowed_values;
    if (dto.is_required !== undefined) data.is_required = dto.is_required;
    if (dto.is_searchable !== undefined) data.is_searchable = dto.is_searchable;
    if (dto.description !== undefined) data.description = dto.description;
    await this.prisma.product_attributes.updateMany({
      where: { tenant_id: tenantId, attribute_id: attributeId },
      data,
    });
    return this.findById(tenantId, attributeId);
  }

  async delete(tenantId: string, attributeId: bigint) {
    const record = await this.findById(tenantId, attributeId);
    await this.prisma.product_attributes.deleteMany({
      where: { tenant_id: tenantId, attribute_id: attributeId },
    });
    return record;
  }
}
