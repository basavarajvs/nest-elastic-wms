import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductAttributeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.product_attributes.create({
      data: {
        tenant_id: tenantId,
        attribute_name: dto.attributeName,
        attribute_code: dto.attributeCode,
        attribute_type: dto.attributeType,
        allowed_values: dto.allowedValues,
        is_required: dto.isRequired ?? false,
        is_searchable: dto.isSearchable ?? false,
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
    const page = query.page || 1;
    const limit = query.limit || 20;
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
    if (dto.attributeName !== undefined) data.attribute_name = dto.attributeName;
    if (dto.attributeCode !== undefined) data.attribute_code = dto.attributeCode;
    if (dto.attributeType !== undefined) data.attribute_type = dto.attributeType;
    if (dto.allowedValues !== undefined) data.allowed_values = dto.allowedValues;
    if (dto.isRequired !== undefined) data.is_required = dto.isRequired;
    if (dto.isSearchable !== undefined) data.is_searchable = dto.isSearchable;
    if (dto.description !== undefined) data.description = dto.description;
    return this.prisma.product_attributes.updateMany({
      where: { tenant_id: tenantId, attribute_id: attributeId },
      data,
    });
  }

  async delete(tenantId: string, attributeId: bigint) {
    return this.prisma.product_attributes.deleteMany({
      where: { tenant_id: tenantId, attribute_id: attributeId },
    });
  }
}
