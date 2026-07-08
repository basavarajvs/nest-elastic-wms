import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  private flattenProduct(product: any): any {
    const {
      is_deleted,
      image_gallery_urls_json,
      product_categories,
      product_brands,
      units_of_measure,
      ...rest
    } = product;
    return {
      ...rest,
      category_name: product_categories?.category_name ?? null,
      brand_name: product_brands?.brand_name ?? null,
      uom_name: units_of_measure?.uom_name ?? null,
      image_gallery_urls: image_gallery_urls_json
        ? JSON.parse(image_gallery_urls_json)
        : [],
    };
  }

  private readonly productInclude = {
    product_categories: { select: { category_code: true, category_name: true } },
    product_brands: { select: { brand_code: true, brand_name: true } },
    units_of_measure: { select: { uom_code: true, uom_name: true } },
  };

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      category_id: BigInt(dto.category_id),
      primary_uom_id: BigInt(dto.primary_uom_id),
      product_code: dto.product_code,
      product_name: dto.product_name,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.short_description !== undefined) data.short_description = dto.short_description;
    if (dto.brand_id !== undefined) data.brand_id = BigInt(dto.brand_id);
    if (dto.base_price !== undefined) data.base_price = dto.base_price;
    if (dto.cost_price !== undefined) data.cost_price = dto.cost_price;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.volume !== undefined) data.volume = dto.volume;
    if (dto.storage_temperature_min !== undefined) data.storage_temperature_min = dto.storage_temperature_min;
    if (dto.storage_temperature_max !== undefined) data.storage_temperature_max = dto.storage_temperature_max;
    if (dto.requires_temperature_control !== undefined) data.requires_temperature_control = dto.requires_temperature_control;
    if (dto.requires_light_control !== undefined) data.requires_light_control = dto.requires_light_control;
    if (dto.requires_humidity_control !== undefined) data.requires_humidity_control = dto.requires_humidity_control;
    if (dto.is_hazardous !== undefined) data.is_hazardous = dto.is_hazardous;
    if (dto.hazmat_class !== undefined) data.hazmat_class = dto.hazmat_class;
    if (dto.hazmat_description !== undefined) data.hazmat_description = dto.hazmat_description;
    if (dto.is_perishable !== undefined) data.is_perishable = dto.is_perishable;
    if (dto.shelf_life_days !== undefined) data.shelf_life_days = dto.shelf_life_days;
    if (dto.track_serial_numbers !== undefined) data.track_serial_numbers = dto.track_serial_numbers;
    if (dto.track_lot_numbers !== undefined) data.track_lot_numbers = dto.track_lot_numbers;
    if (dto.abc_analysis_class !== undefined) data.abc_analysis_class = dto.abc_analysis_class;
    if (dto.default_cycle_count_frequency_days !== undefined) data.default_cycle_count_frequency_days = dto.default_cycle_count_frequency_days;
    if (dto.last_counted_at !== undefined) data.last_counted_at = new Date(dto.last_counted_at);
    if (dto.next_count_due_at !== undefined) data.next_count_due_at = new Date(dto.next_count_due_at);
    if (dto.is_sensitive !== undefined) data.is_sensitive = dto.is_sensitive;
    if (dto.sensitivity_level !== undefined) data.sensitivity_level = dto.sensitivity_level;
    if (dto.eaches_per_case !== undefined) data.eaches_per_case = dto.eaches_per_case;
    if (dto.cases_per_pallet !== undefined) data.cases_per_pallet = dto.cases_per_pallet;
    if (dto.preferred_pick_uom !== undefined) data.preferred_pick_uom = dto.preferred_pick_uom;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.track_expiry !== undefined) data.track_expiry = dto.track_expiry;
    if (dto.primary_image_url !== undefined) data.primary_image_url = dto.primary_image_url;
    if (dto.thumbnail_image_url !== undefined) data.thumbnail_image_url = dto.thumbnail_image_url;
    if (dto.image_gallery_urls !== undefined) data.image_gallery_urls_json = JSON.stringify(dto.image_gallery_urls);
    const product = await this.prisma.products.create({
      data,
      include: this.productInclude,
    });
    return this.flattenProduct(product);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (query.isActive !== undefined) where.is_active = query.isActive;
    if (query.categoryId) where.category_id = BigInt(query.categoryId);
    if (query.brandId) where.brand_id = BigInt(query.brandId);
    if (query.search) {
      where.OR = [
        { product_code: { contains: query.search, mode: 'insensitive' } },
        { product_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { product_code: 'asc' },
        include: this.productInclude,
      }),
      this.prisma.products.count({ where }),
    ]);
    return { data: data.map(p => this.flattenProduct(p)), total, page, limit };
  }

  async findById(tenantId: string, productId: bigint) {
    return this.getFullProduct(tenantId, productId);
  }

  async findLookup(tenantId: string) {
    return this.prisma.products.findMany({
      where: { tenant_id: tenantId, is_active: true, is_deleted: false },
      select: { product_id: true, product_name: true },
      orderBy: { product_name: 'asc' },
    });
  }

  async findByBarcode(tenantId: string, barcode: string) {
    const productBarcode = await this.prisma.product_barcodes.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
      include: {
        products: {
          include: this.productInclude,
        },
      },
    });
    if (!productBarcode?.products) return null;
    return this.flattenProduct(productBarcode.products);
  }

  async getFullProduct(tenantId: string, productId: bigint) {
    const product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_id: productId },
      include: this.productInclude,
    });
    if (!product) return null;

    const [barcodes, suppliers, packaging, variants] = await Promise.all([
      this.prisma.product_barcodes.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
      }),
      this.prisma.product_suppliers.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
        include: {
          vendors: { select: { vendor_code: true, vendor_name: true } },
        },
      }),
      this.prisma.product_packaging_hierarchy.findMany({
        where: { tenant_id: tenantId, product_id: productId },
        include: {
          units_of_measure_product_packaging_hierarchy_parent_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
          units_of_measure_product_packaging_hierarchy_child_uom_idTounits_of_measure: {
            select: { uom_code: true, uom_name: true },
          },
        },
      }),
      this.prisma.product_variants.findMany({
        where: { tenant_id: tenantId, product_id: productId, is_active: true },
      }),
    ]);

    const flattened = this.flattenProduct(product);
    return {
      ...flattened,
      barcodes,
      suppliers,
      packaging,
      variants,
    };
  }

  async update(tenantId: string, productId: bigint, dto: any) {
    const data: any = {};
    if (dto.product_code !== undefined) data.product_code = dto.product_code;
    if (dto.product_name !== undefined) data.product_name = dto.product_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.short_description !== undefined) data.short_description = dto.short_description;
    if (dto.category_id !== undefined) data.category_id = BigInt(dto.category_id);
    if (dto.brand_id !== undefined) data.brand_id = BigInt(dto.brand_id);
    if (dto.primary_uom_id !== undefined) data.primary_uom_id = BigInt(dto.primary_uom_id);
    if (dto.base_price !== undefined) data.base_price = dto.base_price;
    if (dto.cost_price !== undefined) data.cost_price = dto.cost_price;
    if (dto.length !== undefined) data.length = dto.length;
    if (dto.width !== undefined) data.width = dto.width;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.volume !== undefined) data.volume = dto.volume;
    if (dto.storage_temperature_min !== undefined) data.storage_temperature_min = dto.storage_temperature_min;
    if (dto.storage_temperature_max !== undefined) data.storage_temperature_max = dto.storage_temperature_max;
    if (dto.requires_temperature_control !== undefined) data.requires_temperature_control = dto.requires_temperature_control;
    if (dto.requires_light_control !== undefined) data.requires_light_control = dto.requires_light_control;
    if (dto.requires_humidity_control !== undefined) data.requires_humidity_control = dto.requires_humidity_control;
    if (dto.is_hazardous !== undefined) data.is_hazardous = dto.is_hazardous;
    if (dto.hazmat_class !== undefined) data.hazmat_class = dto.hazmat_class;
    if (dto.hazmat_description !== undefined) data.hazmat_description = dto.hazmat_description;
    if (dto.is_perishable !== undefined) data.is_perishable = dto.is_perishable;
    if (dto.shelf_life_days !== undefined) data.shelf_life_days = dto.shelf_life_days;
    if (dto.track_serial_numbers !== undefined) data.track_serial_numbers = dto.track_serial_numbers;
    if (dto.track_lot_numbers !== undefined) data.track_lot_numbers = dto.track_lot_numbers;
    if (dto.abc_analysis_class !== undefined) data.abc_analysis_class = dto.abc_analysis_class;
    if (dto.default_cycle_count_frequency_days !== undefined) data.default_cycle_count_frequency_days = dto.default_cycle_count_frequency_days;
    if (dto.last_counted_at !== undefined) data.last_counted_at = new Date(dto.last_counted_at);
    if (dto.next_count_due_at !== undefined) data.next_count_due_at = new Date(dto.next_count_due_at);
    if (dto.is_sensitive !== undefined) data.is_sensitive = dto.is_sensitive;
    if (dto.sensitivity_level !== undefined) data.sensitivity_level = dto.sensitivity_level;
    if (dto.eaches_per_case !== undefined) data.eaches_per_case = dto.eaches_per_case;
    if (dto.cases_per_pallet !== undefined) data.cases_per_pallet = dto.cases_per_pallet;
    if (dto.preferred_pick_uom !== undefined) data.preferred_pick_uom = dto.preferred_pick_uom;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.track_expiry !== undefined) data.track_expiry = dto.track_expiry;
    if (dto.primary_image_url !== undefined) data.primary_image_url = dto.primary_image_url;
    if (dto.thumbnail_image_url !== undefined) data.thumbnail_image_url = dto.thumbnail_image_url;
    if (dto.image_gallery_urls !== undefined) data.image_gallery_urls_json = JSON.stringify(dto.image_gallery_urls);
    await this.prisma.products.updateMany({
      where: { tenant_id: tenantId, product_id: productId },
      data,
    });
    return this.getFullProduct(tenantId, productId);
  }

  async delete(tenantId: string, productId: bigint) {
    const record = await this.getFullProduct(tenantId, productId);
    await this.prisma.products.deleteMany({
      where: { tenant_id: tenantId, product_id: productId },
    });
    return record;
  }

  async findByCategory(tenantId: string, categoryId: bigint, query: any) {
    const where: any = { tenant_id: tenantId, category_id: categoryId, is_deleted: false };
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { product_code: 'asc' },
        include: this.productInclude,
      }),
      this.prisma.products.count({ where }),
    ]);
    return { data: data.map(p => this.flattenProduct(p)), total, page, limit };
  }

  async rfLookup(tenantId: string, barcode: string) {
    const productBarcode = await this.prisma.product_barcodes.findFirst({
      where: { tenant_id: tenantId, barcode_value: barcode, is_active: true },
      include: {
        products: {
          include: {
            product_categories: { select: { category_code: true, category_name: true } },
            units_of_measure: { select: { uom_code: true } },
          },
        },
      },
    });
    if (!productBarcode?.products) return null;
    const p = productBarcode.products;
    return {
      productId: p.product_id.toString(),
      productCode: p.product_code,
      productName: p.product_name,
      barcode: productBarcode.barcode_value,
      category: p.product_categories?.category_code || null,
      uom: p.units_of_measure?.uom_code || null,
    };
  }
}
