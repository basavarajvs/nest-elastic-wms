import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackingMaterialService {
  private readonly logger = new Logger(PackingMaterialService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.packing_materials.create({
      data: {
        tenant_id: tenantId,
        material_code: dto.material_code,
        material_name: dto.material_name,
        description: dto.description,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        weight: dto.weight,
        volume: dto.volume,
        uom_id: BigInt(dto.uom_id),
        standard_cost: dto.standard_cost,
        currency_code: dto.currency_code,
        compatible_products_json: dto.compatible_products_json,
        compatible_containers_json: dto.compatible_containers_json,
        is_active: dto.is_active ?? true,
        is_deleted: dto.is_deleted ?? false,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.search) {
      where.OR = [
        { material_code: { contains: query.search, mode: 'insensitive' } },
        { material_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.packing_materials.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { material_name: 'asc' },
      }),
      this.prisma.packing_materials.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: bigint) {
    const row = await this.prisma.packing_materials.findFirst({
      where: { tenant_id: tenantId, material_id: id, is_deleted: false },
    });
    if (!row) throw new NotFoundException('Packing material not found');
    return row;
  }

  async update(tenantId: string, id: bigint, dto: any) {
    await this.findById(tenantId, id);
    const data: any = {};
    if (dto.material_code !== undefined) data.material_code = dto.material_code;
    if (dto.material_name !== undefined) data.material_name = dto.material_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.volume !== undefined) data.volume = dto.volume;
    if (dto.uom_id !== undefined) data.uom_id = BigInt(dto.uom_id);
    if (dto.standard_cost !== undefined) data.standard_cost = dto.standard_cost;
    if (dto.currency_code !== undefined) data.currency_code = dto.currency_code;
    if (dto.compatible_products_json !== undefined) data.compatible_products_json = dto.compatible_products_json;
    if (dto.compatible_containers_json !== undefined) data.compatible_containers_json = dto.compatible_containers_json;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.is_deleted !== undefined) data.is_deleted = dto.is_deleted;
    if (!Object.keys(data).length) throw new BadRequestException('No fields to update');
    return this.prisma.packing_materials.update({
      where: { material_id: id },
      data,
    });
  }

  async delete(tenantId: string, id: bigint) {
    const row = await this.findById(tenantId, id);
    await this.prisma.packing_materials.update({
      where: { material_id: id },
      data: { is_deleted: true },
    });
    return row;
  }
}
