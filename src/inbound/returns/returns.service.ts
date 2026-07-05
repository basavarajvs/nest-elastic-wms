import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const data: any = {
      tenant_id: tenantId,
      facility_id: BigInt(dto.facilityId),
      return_number: dto.returnNumber,
      return_name: dto.returnName,
      description: dto.description,
      original_order_number: dto.originalOrderNumber,
      original_shipment_number: dto.originalShipmentNumber,
      client_id: BigInt(dto.clientId),
      return_date: dto.returnDate ? new Date(dto.returnDate) : new Date(),
      return_reason: dto.returnReason,
      assigned_to_user_id: dto.assignedToUserId,
      notes: dto.notes,
    };

    if (dto.items && dto.items.length > 0) {
      data.customer_return_items = {
        create: dto.items.map((item: any) => ({
          tenant_id: tenantId,
          facility_id: BigInt(dto.facilityId),
          product_id: BigInt(item.productId),
          product_name: item.productName,
          product_code: item.productCode,
          returned_quantity: item.returnedQuantity,
          uom_id: BigInt(item.uomId),
          condition_received: item.conditionReceived || 'GOOD',
          return_reason_detail: item.returnReasonDetail,
          notes: item.notes,
        })),
      };
    }

    const ret = await this.prisma.customer_returns.create({ data });
    return this.findById(tenantId, ret.return_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.returnStatus) where.return_status = query.returnStatus;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.search) {
      where.OR = [
        { return_number: { contains: query.search, mode: 'insensitive' } },
        { client_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.customer_returns.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { return_date: 'desc' },
      }),
      this.prisma.customer_returns.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, returnId: bigint) {
    return this.prisma.customer_returns.deleteMany({
      where: { tenant_id: tenantId, return_id: returnId },
    });
  }

  async findById(tenantId: string, returnId: bigint) {
    const ret = await this.prisma.customer_returns.findFirst({
      where: { tenant_id: tenantId, return_id: returnId },
    });
    if (!ret) return null;
    const items = await this.prisma.customer_return_items.findMany({
      where: { tenant_id: tenantId, return_id: returnId },
      orderBy: { return_item_id: 'asc' },
    });
    return { ...ret, items };
  }

  async update(tenantId: string, returnId: bigint, dto: any) {
    return this.prisma.customer_returns.updateMany({
      where: { tenant_id: tenantId, return_id: returnId },
      data: {
        return_reason: dto.returnReason,
        assigned_to_user_id: dto.assignedToUserId,
        notes: dto.notes,
      },
    });
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
        const returnItemId = item.returnItemId ? BigInt(item.returnItemId) : undefined;
        if (!returnItemId) continue;

        const returnItem = await this.prisma.customer_return_items.findFirst({
          where: { tenant_id: tenantId, return_item_id: returnItemId },
        });
        if (!returnItem) continue;

        const receivedLocationId = item.receivedLocationId
          ? BigInt(item.receivedLocationId)
          : undefined;

        // Update item status — items with damaged/unknown condition go to INSPECTION
        const condition = item.conditionReceived || returnItem.condition_received;
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
        const qty = Number(item.returnedQuantity || returnItem.returned_quantity);
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
