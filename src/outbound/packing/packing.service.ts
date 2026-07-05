import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackingService {
  private readonly logger = new Logger(PackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteSession(tenantId: string, sessionId: bigint) {
    return this.prisma.packing_sessions.deleteMany({
      where: { tenant_id: tenantId, id: sessionId },
    });
  }

  /** Start a packing session at a station */
  async startSession(tenantId: string, dto: any) {
    const station = dto.stationId
      ? await this.prisma.packing_stations.findFirst({
          where: { tenant_id: tenantId, station_id: BigInt(dto.stationId), is_active: true },
        })
      : null;

    if (dto.stationId && !station) throw new BadRequestException('Station not found or inactive');

    const session = await this.prisma.packing_sessions.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facilityId ? BigInt(dto.facilityId) : BigInt(1),
        session_number: dto.sessionNumber || `PACK-${Date.now()}`,
        user_id: dto.userId,
        station_id: dto.stationId ? BigInt(dto.stationId) : undefined,
        station_code: station?.station_code,
        start_time: new Date(),
        last_activity_time: new Date(),
        current_order_id: dto.orderId ? BigInt(dto.orderId) : undefined,
        status: 'STATION_ASSIGNED',
      },
    });

    await this.prisma.packing_session_status_history.create({
      data: {
        tenant_id: tenantId,
        session_id: session.id,
        current_status: 'STATION_ASSIGNED',
        changed_by: dto.userId,
      },
    });

    if (station) {
      await this.prisma.packing_stations.updateMany({
        where: { tenant_id: tenantId, station_id: station.station_id },
        data: { is_available: false },
      });
    }

    return session;
  }

  /** Assign an order to the packing session */
  async assignOrder(tenantId: string, sessionId: bigint, orderId: bigint) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    await this.prisma.packing_sessions.updateMany({
      where: { tenant_id: tenantId, id: sessionId },
      data: { current_order_id: orderId, last_activity_time: new Date() },
    });

    return this.findSessionById(tenantId, sessionId);
  }

  /**
   * Pack items: record what was packed into a container.
   * Creates packing slip, packing slip items, and links to shipment.
   */
  async packItems(tenantId: string, sessionId: bigint, dto: any) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    const orderId = dto.orderId || session.current_order_id;
    if (!orderId) throw new BadRequestException('No order assigned to session');

    if (!session.facility_id) throw new BadRequestException('Session missing facility_id');

    const slip = await this.prisma.packing_slips.create({
      data: {
        tenant_id: tenantId,
        facility_id: session.facility_id,
        packing_slip_number: dto.packingSlipNumber || `SLIP-${session.session_number}-${(session.cartons_completed || 0) + 1}`,
        order_id: orderId,
        session_id: sessionId,
        packed_by_user_id: session.user_id,
        weight: dto.weight,
        volume: dto.volume,
      },
    });

    const items = dto.items || [];
    for (const item of items) {
      await this.prisma.packing_slip_items.create({
        data: {
          tenant_id: tenantId,
          facility_id: session.facility_id,
          packing_slip_id: slip.packing_slip_id,
          picking_task_id: item.pickingTaskId ? BigInt(item.pickingTaskId) : undefined,
          product_id: BigInt(item.productId),
          quantity_packed: item.quantityPacked,
          uom_id: item.uomId ? BigInt(item.uomId) : BigInt(1),
          lot_number: item.lotNumber,
          serial_numbers_json: item.serialNumbers ? JSON.stringify(item.serialNumbers) : undefined,
          container_id: item.containerId ? BigInt(item.containerId) : undefined,
        },
      });
    }

    // Create or assign container
    let containerId: bigint | undefined;
    if (dto.containerCode) {
      const container = await this.prisma.packing_containers.create({
        data: {
          tenant_id: tenantId,
          facility_id: session.facility_id,
          container_code: dto.containerCode,
          container_type: dto.containerType || 'BOX',
          packing_slip_id: slip.packing_slip_id,
          seal_number: dto.sealNumber,
        },
      });
      containerId = container.container_id;
    }

    // Update session stats
    await this.prisma.packing_sessions.updateMany({
      where: { tenant_id: tenantId, id: sessionId },
      data: {
        cartons_completed: { increment: 1 },
        items_packed: { increment: items.length },
        last_activity_time: new Date(),
      },
    });

    return { slip, containerId };
  }

  /**
   * RF: Close carton — create shipping LPN, update order to PACKED, return label data.
   * Manhattan: generates shipping LPN and sends ZPL to printer.
   */
  async closeCarton(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    const orderId = dto.orderId || session.current_order_id;
    if (!orderId) throw new BadRequestException('No order assigned to session');

    // Find or create the shipping LPN
    const lpnNumber = dto.cartonBarcode || `CARTON-${session.session_number}-${(session.cartons_completed || 0) + 1}`;
    let lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: lpnNumber },
    });
    if (!lpn) {
      const stagingLocation = await this.prisma.storage_locations.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, location_type: 'TEMPORARY' },
        orderBy: { location_code: 'asc' },
      });
      lpn = await this.prisma.license_plate_numbers.create({
        data: {
          tenant_id: tenantId,
          facility_id: facilityId,
          lpn_number: lpnNumber,
          location_id: stagingLocation?.location_id || 0,
          product_id: dto.productId ? BigInt(dto.productId) : null,
          lpn_type: 'CARTON',
          status: 'PACKED',
          gross_weight: dto.weight ? dto.weight : null,
        },
      });
    }

    // Link LPN to the shipment if order has one
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    if (order) {
      const shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, order_id: orderId },
      });
      if (shipment) {
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { assigned_shipment_id: shipment.shipment_id },
        });
      }
    }

    // Update order status to PACKED
    await this.prisma.sales_orders.updateMany({
      where: { tenant_id: tenantId, order_id: orderId },
      data: { status: 'PACKED' },
    });

    // Generate label placeholder (ZPL stub — real ZPL would come from carrier integration)
    const labelData = `^XA^FO50,50^ADN,36,20^FD${lpnNumber}^FS^FO50,100^ADN,18,10^FDOrder: ${order?.order_number || orderId}^FS^FO50,150^ADN,18,10^FDCarton: ${(session.cartons_completed || 0) + 1}^FS^XZ`;

    return {
      lpnId: lpn.lpn_id.toString(),
      lpnNumber: lpn.lpn_number,
      labelData,
      orderId: orderId.toString(),
      orderNumber: order?.order_number || null,
      cartonIndex: (session.cartons_completed || 0) + 1,
    };
  }

  /** Seal a container: record seal number, close container */
  async sealContainer(tenantId: string, containerId: bigint, sealNumber: string) {
    const container = await this.prisma.packing_containers.findFirst({
      where: { tenant_id: tenantId, container_id: containerId },
    });
    if (!container) throw new BadRequestException('Container not found');

    await this.prisma.packing_containers.updateMany({
      where: { tenant_id: tenantId, container_id: containerId },
      data: { seal_number: sealNumber },
    });

    return this.prisma.packing_containers.findFirst({
      where: { tenant_id: tenantId, container_id: containerId },
    });
  }

  /** Complete a packing session */
  async completeSession(tenantId: string, sessionId: bigint) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    await this.prisma.packing_sessions.updateMany({
      where: { tenant_id: tenantId, id: sessionId },
      data: {
        status: 'PACKING_COMPLETED',
        end_time: new Date(),
        last_activity_time: new Date(),
      },
    });

    await this.prisma.packing_session_status_history.create({
      data: {
        tenant_id: tenantId,
        session_id: sessionId,
        previous_status: session.status as string,
        current_status: 'PACKING_COMPLETED',
        changed_by: session.user_id,
      },
    });

    // Release station
    if (session.station_id) {
      await this.prisma.packing_stations.updateMany({
        where: { tenant_id: tenantId, station_id: session.station_id },
        data: { is_available: true },
      });
    }

    return this.findSessionById(tenantId, sessionId);
  }

  async findSessionById(tenantId: string, sessionId: bigint) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) return null;
    const slips = await this.prisma.packing_slips.findMany({
      where: { tenant_id: tenantId, session_id: sessionId },
    });
    const history = await this.prisma.packing_session_status_history.findMany({
      where: { tenant_id: tenantId, session_id: sessionId },
      orderBy: { changed_at: 'asc' },
    });
    return { ...session, packingSlips: slips, statusHistory: history };
  }

  async getStations(tenantId: string, facilityId: bigint) {
    return this.prisma.packing_stations.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { station_code: 'asc' },
    });
  }

  /** Verify product is on the order (RF scan-item) */
  async verifyProduct(tenantId: string, productCode: string, orderId: bigint) {
    let product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_code: productCode },
    });
    if (!product) {
      const pb = await this.prisma.product_barcodes.findFirst({
        where: { tenant_id: tenantId, barcode_value: productCode },
        include: { products: true },
      });
      product = pb?.products || null;
    }
    if (!product) return null;

    const line = await this.prisma.sales_order_lines.findFirst({
      where: { tenant_id: tenantId, order_id: orderId, product_id: product.product_id },
    });
    if (!line) return null;

    return { product, line };
  }

  /** Find active session for a user (RF my-session) */
  async findSessionByUser(tenantId: string, userId: string) {
    return this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, user_id: userId, status: { in: ['STATION_ASSIGNED', 'PACKING_ACTIVE'] } },
      orderBy: { start_time: 'desc' },
    });
  }

  // GAP-1: Directed pack work
  async getNextPackWork(tenantId: string, facilityId: bigint, stationId: bigint, userId: string) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'PICKED' },
      orderBy: { created_at: 'asc' },
    });
    if (!order) return null;
    const pickLpns = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, assigned_shipment_id: order.order_id, status: 'PICKED' },
    });
    return { order, pickLpns };
  }

  // GAP-9: Nest pick LPN into carton LPN
  async nestPickLpn(tenantId: string, cartonLpnId: bigint, pickLpnId: bigint) {
    const cartonLpn = await this.prisma.license_plate_numbers.findFirst({ where: { tenant_id: tenantId, lpn_id: cartonLpnId } });
    if (!cartonLpn) throw new BadRequestException('Carton LPN not found');
    const pickLpn = await this.prisma.license_plate_numbers.findFirst({ where: { tenant_id: tenantId, lpn_id: pickLpnId } });
    if (!pickLpn) throw new BadRequestException('Pick LPN not found');
    if (pickLpn.status !== 'PICKED') throw new BadRequestException(`Pick LPN status is ${pickLpn.status}, must be PICKED`);
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: pickLpnId },
      data: { parent_lpn_id: cartonLpnId, status: 'NESTED', updated_at: new Date() },
    });
    return { cartonLpnId, pickLpnId, status: 'NESTED' };
  }

  // GAP-5: Report shortage during packing
  async reportShortage(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const exception = await this.prisma.packing_exceptions.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId,
        session_id: sessionId, order_id: BigInt(dto.orderId),
        exception_type: 'SHORTAGE',
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        expected_qty: dto.expectedQty, packed_qty: dto.packedQty,
        reason_code: dto.reasonCode, status: 'OPEN',
        notes: dto.notes,
      },
    });
    return exception;
  }

  // GAP-6: Report damage during packing
  async reportPackingDamage(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const exception = await this.prisma.packing_exceptions.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId,
        session_id: sessionId, order_id: BigInt(dto.orderId),
        exception_type: 'DAMAGE',
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        expected_qty: dto.expectedQty, packed_qty: 0,
        reason_code: dto.reasonCode || 'DAMAGE', status: 'OPEN',
        notes: dto.notes,
      },
    });
    await this.prisma.quality_holds.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId,
        hold_number: `HOLD-PACK-${Date.now()}`,
        reference_type: 'PACKING', reference_id: exception.exception_id,
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        hold_reason: dto.reasonCode || 'PACKING_DAMAGE',
        hold_reason_code: 'PACKING_DAMAGE',
        placed_by_user_id: dto.userId || '', affected_quantity: dto.expectedQty || 0,
        status: 'OPEN',
      },
    });
    return exception;
  }

  // GAP-7: Supervisor override
  async getPendingExceptions(tenantId: string, facilityId: bigint) {
    return this.prisma.packing_exceptions.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'OPEN' },
      orderBy: { created_at: 'desc' },
    });
  }

  async approveException(tenantId: string, exceptionId: bigint, supervisorId: string) {
    const exc = await this.prisma.packing_exceptions.findFirst({ where: { tenant_id: tenantId, exception_id: exceptionId } });
    if (!exc) throw new BadRequestException('Exception not found');
    return this.prisma.packing_exceptions.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: { status: 'RESOLVED', resolved_by: supervisorId, resolved_at: new Date() },
    });
  }

  async rejectException(tenantId: string, exceptionId: bigint, supervisorId: string) {
    return this.prisma.packing_exceptions.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: { status: 'RESOLVED', resolved_by: supervisorId, resolved_at: new Date(), notes: 'Rejected by supervisor' },
    });
  }
}
