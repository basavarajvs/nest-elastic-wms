import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facility_id),
      return_number: dto.rma_number,
      return_name: dto.return_name,
      description: dto.description,
      original_order_number: dto.original_order_number,
      original_shipment_number: dto.original_shipment_number,
      client_id: BigInt(dto.client_id),
      return_date: dto.return_date ? new Date(dto.return_date) : new Date(),
      return_reason: dto.reason_code,
      currency_code: dto.currency_code,
      assigned_to_user_id: dto.assigned_to_user_id,
      notes: dto.notes,
    };

    if (dto.items && dto.items.length > 0) {
      data.customer_return_items = {
        create: dto.items.map((item: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facility_id),
          product_id: BigInt(item.product_id),
          product_name: item.product_name,
          product_code: item.product_code,
          returned_quantity: item.returned_quantity,
          uom_id: BigInt(item.uom_id),
          condition_received: item.condition_received || 'GOOD',
          return_reason_detail: item.return_reason_detail,
          sampling_method: item.sampling_method,
          sampling_percentage: item.sampling_percentage,
          sample_size: item.sample_size,
          total_population_quantity: item.total_population_quantity,
          population_result: item.population_result,
          requires_supervisor_review: item.requires_supervisor_review ?? false,
          notes: item.notes,
        })),
      };
    }

    const ret = await this.prisma.customer_returns.create({ data });
    return this.findById(tenantId, ret.return_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, ...(query.facilityId ? { facility_id: BigInt(query.facilityId) } : {})  };
    if (query.returnStatus) where.return_status = query.returnStatus;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.search) {
      where.OR = [
        { return_number: { contains: query.search, mode: 'insensitive' } },
        { client_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.customer_returns.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { return_date: 'desc' },
        include: { warehouse_facilities: true },
      }),
      this.prisma.customer_returns.count({ where }),
    ]);
    return {
      data: data.map(ret => ({
        ...ret,
        facility_name: ret.warehouse_facilities?.facility_name ?? null,
        warehouse_facilities: undefined,
      })),
      total, page, limit,
    };
  }

  async delete(tenantId: string, returnId: bigint) {
    const result = await this.prisma.customer_returns.deleteMany({
      where: { tenant_id: tenantId, return_id: returnId },
    });
    return { count: result.count };
  }

  async findById(tenantId: string, returnId: bigint) {
    const ret = await this.prisma.customer_returns.findFirst({
      where: { tenant_id: tenantId, return_id: returnId },
      include: { warehouse_facilities: true },
    });
    if (!ret) return null;
    const items = await this.prisma.customer_return_items.findMany({
      where: { tenant_id: tenantId, return_id: returnId },
      orderBy: { return_item_id: 'asc' },
      include: { warehouse_facilities: true, units_of_measure: true },
    });
    const locationIds = items.filter(i => i.received_location_id).map(i => i.received_location_id!);
    const locations = locationIds.length
      ? await this.prisma.storage_locations.findMany({ where: { location_id: { in: locationIds } } })
      : [];
    const locationMap = new Map(locations.map(l => [l.location_id.toString(), l.location_name]));
    return {
      ...ret,
      facility_name: ret.warehouse_facilities?.facility_name ?? null,
      warehouse_facilities: undefined,
      items: items.map(item => ({
        ...item,
        facility_name: item.warehouse_facilities?.facility_name ?? null,
        uom_name: item.units_of_measure?.uom_name ?? null,
        location_name: item.received_location_id
          ? locationMap.get(item.received_location_id.toString()) ?? null
          : null,
        warehouse_facilities: undefined,
        units_of_measure: undefined,
      })),
    };
  }

  async update(tenantId: string, returnId: bigint, dto: any) {
    await this.prisma.customer_returns.updateMany({
      where: { tenant_id: tenantId, return_id: returnId },
      data: {
        return_reason: dto.reason_code,
        assigned_to_user_id: dto.assigned_to_user_id,
        notes: dto.notes,
      },
    });
    return this.findById(tenantId, returnId);
  }

  /**
   * Receive returned items: transitions status to RECEIVED, creates
   * inventory holds for QC_PENDING on every returned item, and
   * generates an inventory transaction for the return.
   */
  async receiveReturn(tenantId: string, returnId: bigint, userId: string, dto: any) {
    const ret = await this.prisma.customer_returns.findFirst({
      where: { tenant_id: tenantId, return_id: returnId },
    });
    if (!ret) throw new BadRequestException('Return not found');
    if (ret.return_status !== 'PENDING' && ret.return_status !== 'APPROVED') {
      throw new BadRequestException('Return must be PENDING or APPROVED to receive');
    }

    await this.prisma.customer_returns.updateMany({
      where: { tenant_id: tenantId, return_id: returnId },
      data: {
        return_status: 'RECEIVED',
        received_date: new Date(),
      },
    });

    if (dto.items) {
      for (const item of dto.items) {
        const returnItemId = item.return_item_id ? BigInt(item.return_item_id) : undefined;
        if (!returnItemId) continue;

        const returnItem = await this.prisma.customer_return_items.findFirst({
          where: { tenant_id: tenantId, return_item_id: returnItemId },
        });
        if (!returnItem) continue;

        const receivedLocationId = item.received_location_id
          ? BigInt(item.received_location_id)
          : undefined;

        // Update item status — items with damaged/unknown condition go to INSPECTION
        const condition = item.condition_received || returnItem.condition_received;
        const newStatus = condition === 'GOOD' ? 'RECEIVED' : 'PENDING_INSPECTION';

        await this.prisma.customer_return_items.updateMany({
          where: { tenant_id: tenantId, return_item_id: returnItemId },
          data: {
            status: newStatus,
            received_location_id: receivedLocationId,
            condition_received: condition,
          },
        });

        // Create inventory hold for QC inspection on all returned items
        await this.prisma.inventory_holds.create({
          data: {
            tenant_id: tenantId,
            facility_id: ret.facility_id,
            hold_reason: 'QC_PENDING',
            status: 'ACTIVE',
            hold_reason_code: 'RETURN_QC',
            hold_reason_description: `Customer return ${ret.return_number} — item ${returnItemId}`,
            placed_by_user_id: userId,
          },
        });

        // Create inventory transaction for the return
        const qty = Number(item.returned_quantity || returnItem.returned_quantity);
        if (qty > 0 && receivedLocationId) {
          await this.prisma.inventory_transactions.create({
            data: {
              tenant_id: tenantId,
              facility_id: ret.facility_id,
              reference_type: 'RETURN',
              reference_id: returnId,
              product_id: returnItem.product_id,
              to_location_id: receivedLocationId,
              transaction_type: 'RETURN',
              transaction_status: 'COMPLETED',
              quantity: qty,
              uom_id: returnItem.uom_id,
              reason_code: condition === 'GOOD' ? 'RETURN_GOOD' : 'RETURN_DAMAGED',
              notes: `Customer return ${ret.return_number}`,
              reference_document_type: 'RETURN',
              reference_document_number: ret.return_number,
              performed_by_user_id: userId,
            },
          });
        }
      }
    }

    return this.findById(tenantId, returnId);
  }
}
