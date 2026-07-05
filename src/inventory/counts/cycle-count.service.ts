import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CycleCountService {
  private readonly logger = new Logger(CycleCountService.name);

  constructor(private readonly prisma: PrismaService) {}

  async delete(tenantId: string, id: bigint) {
    return this.prisma.inventory_counts.deleteMany({
      where: { tenant_id: tenantId, count_id: id },
    });
  }

  async create(tenantId: string, dto: any) {
    const { facilityId, ...rest } = dto;
    return this.prisma.inventory_counts.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId ? BigInt(facilityId) : undefined,
        ...rest,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { status, facilityId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (facilityId) where.facility_id = BigInt(facilityId);
    const [data, total] = await Promise.all([
      this.prisma.inventory_counts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventory_counts.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.inventory_counts.findFirst({
      where: { tenant_id: tenantId, count_id: BigInt(id) },
    });
  }

  async update(tenantId: string, id: string, dto: any) {
    await this.findById(tenantId, id);
    const { facilityId, ...rest } = dto;
    return this.prisma.inventory_counts.update({
      where: { count_id: BigInt(id) },
      data: {
        ...(facilityId !== undefined ? { facility_id: BigInt(facilityId) } : {}),
        ...rest,
      },
    });
  }

  /**
   * RF: Scan location for cycle count. Returns items at location WITHOUT system qty (blind count).
   */
  async scanLocationForCount(tenantId: string, facilityId: bigint, locationBarcode: string) {
    const location = await this.prisma.storage_locations.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        OR: [{ location_code: locationBarcode }, { barcode_value: locationBarcode }],
      },
    });
    if (!location) throw new Error('Location not found');

    const lpns = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, location_id: location.location_id },
      select: { lpn_id: true, lpn_number: true, product_id: true },
    });

    const onHand = await this.prisma.inventory_on_hand.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, location_id: location.location_id },
    });

    const productIds = new Set<bigint>();
    lpns.forEach((l) => { if (l.product_id) productIds.add(l.product_id); });
    onHand.forEach((o) => productIds.add(o.product_id));

    const products = productIds.size > 0
      ? await this.prisma.products.findMany({
          where: { tenant_id: tenantId, product_id: { in: Array.from(productIds) } },
          select: { product_id: true, product_code: true, product_name: true },
        })
      : [];

    // Manhattan: blind count — do NOT return system quantity
    const items = onHand.map((o) => {
      const product = products.find((p) => p.product_id === o.product_id);
      return {
        productId: o.product_id.toString(),
        productCode: product?.product_code || null,
        productName: product?.product_name || null,
        lpnNumber: lpns.find((l) => l.product_id === o.product_id)?.lpn_number || null,
      };
    });

    return {
      locationId: location.location_id.toString(),
      locationCode: location.location_code,
      barcodeValue: location.barcode_value,
      items,
      itemCount: items.length,
    };
  }

  /**
   * RF: Verify scanned LPN/product matches expected at location before counting.
   */
  async verifyItemAtLocation(tenantId: string, facilityId: bigint, locationBarcode: string, lpnBarcode: string) {
    const location = await this.prisma.storage_locations.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: facilityId,
        OR: [{ location_code: locationBarcode }, { barcode_value: locationBarcode }],
      },
    });
    if (!location) throw new Error('Location not found');

    // Try LPN lookup first
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: lpnBarcode, location_id: location.location_id },
    });
    if (lpn) {
      const product = lpn.product_id
        ? await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: lpn.product_id } })
        : null;
      return { verified: true, matchType: 'LPN', lpn, product };
    }

    // Try product barcode lookup
    let product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_code: lpnBarcode },
    });
    if (!product) {
      const pb = await this.prisma.product_barcodes.findFirst({
        where: { tenant_id: tenantId, barcode_value: lpnBarcode },
        include: { products: true },
      });
      product = pb?.products || null;
    }

    if (product) {
      const onHand = await this.prisma.inventory_on_hand.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, product_id: product.product_id, location_id: location.location_id },
      });
      if (onHand) {
        return { verified: true, matchType: 'PRODUCT', product, onHandQty: Number(onHand.quantity_on_hand) };
      }
    }

    throw new Error('Scanned barcode does not match any LPN or product at this location');
  }

  async submitLine(tenantId: string, countId: string, dto: any) {
    const systemQty = dto.systemQuantity || await this.getSystemQuantity(
      tenantId,
      BigInt(dto.productId),
      BigInt(dto.locationId),
      dto.lotId ? BigInt(dto.lotId) : null,
    );
    const countedQty = Number(dto.countedQuantity || dto.quantity || 0);
    const variance = Math.abs(countedQty - systemQty);
    const tolerance = 0.05 * Math.max(systemQty, 1);
    const hasVariance = variance > tolerance;

    const line = await this.prisma.inventory_count_lines.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId || 0),
        count_id: BigInt(countId),
        product_id: BigInt(dto.productId),
        location_id: BigInt(dto.locationId),
        ...(dto.lotId ? { lot_id: BigInt(dto.lotId) } : {}),
        counted_quantity: countedQty,
        system_quantity: systemQty,
        counted_by_user_id: dto.userId || null,
        notes: dto.notes || null,
      },
    });

    // Manhattan: immediate variance check — auto-approve if match, flag otherwise
    return {
      line,
      matchStatus: hasVariance ? 'MISMATCH' : 'MATCH',
      systemQty,
      countedQty,
      variance,
      requiresRecount: hasVariance,
      requiresSupervisorApproval: hasVariance && variance > tolerance * 2,
    };
  }

  /** Complete count with variance detection and investigation creation */
  async complete(tenantId: string, id: string, userId: string, facilityId?: string) {
    const count = await this.findById(tenantId, id);
    if (!count) throw new Error('Cycle count not found');
    if (count.status === 'COMPLETED') throw new Error('Cycle count already completed');

    const lines = await this.prisma.inventory_count_lines.findMany({
      where: { tenant_id: tenantId, count_id: BigInt(id) },
    });

    let totalVarianceQty = 0;
    let varianceLines = 0;

    for (const line of lines) {
      const systemQty = await this.getSystemQuantity(
        tenantId,
        line.product_id,
        line.location_id,
        line.lot_id,
      );

      const countedQty = Number(line.counted_quantity || 0);
      const variance = Math.abs(countedQty - systemQty);
      const tolerance = 0.05 * Math.max(systemQty, 1);

      await this.prisma.inventory_count_lines.update({
        where: { count_line_id: line.count_line_id },
        data: {
          system_quantity: systemQty,
        },
      });

      if (variance > tolerance) {
        totalVarianceQty += variance;
        varianceLines++;

        await this.prisma.variance_investigations.create({
          data: {
            tenant_id: tenantId,
            facility_id: line.facility_id,
            count_id: line.count_id,
            product_id: line.product_id,
            location_id: line.location_id,
            system_quantity: systemQty,
            counted_quantity: countedQty,
            variance_quantity: variance,
            variance_percentage: systemQty > 0 ? (variance / systemQty) * 100 : 100,
            status: 'OPEN',
          },
        });
      }
    }

    const updated = await this.prisma.inventory_counts.update({
      where: { count_id: BigInt(id) },
      data: {
        status: 'COMPLETED',
        total_variances: varianceLines,
        total_variance_quantity: totalVarianceQty,
        completed_at: new Date(),
      },
    });

    return updated;
  }

  private async getSystemQuantity(
    tenantId: string,
    productId: bigint,
    locationId: bigint,
    lotId?: bigint | null,
  ): Promise<number> {
    const where: any = {
      tenant_id: tenantId,
      product_id: productId,
      location_id: locationId,
    };
    if (lotId !== undefined && lotId !== null) where.lot_id = lotId;

    const records = await this.prisma.inventory_on_hand.findMany({ where });
    return records.reduce((sum, r) => sum + Number(r.quantity_on_hand || 0), 0);
  }
}
