import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CartonizationService } from './cartonization.service';
import { CartonPackedEvent } from '../../events/definitions/outbound.events';

@Injectable()
export class PackingService {
  private readonly logger = new Logger(PackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cartonizationService: CartonizationService,
  ) {}

  async deleteSession(tenantId: string, sessionId: bigint) {
    const session = await this.findSessionById(tenantId, sessionId);
    await this.prisma.packing_sessions.deleteMany({
      where: { tenant_id: tenantId, id: sessionId },
    });
    return session;
  }

  /** Start a packing session at a station */
  async startSession(tenantId: string, dto: any) {
    const station = dto.station_id
      ? await this.prisma.packing_stations.findFirst({
          where: { tenant_id: tenantId, station_id: BigInt(dto.station_id), is_active: true },
        })
      : null;

    if (dto.station_id && !station) throw new BadRequestException('Station not found or inactive');

    const session = await this.prisma.packing_sessions.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facility_id ? BigInt(dto.facility_id) : BigInt(1),
        session_number: dto.session_number || `PACK-${Date.now()}`,
        user_id: dto.user_id,
        station_id: dto.station_id ? BigInt(dto.station_id) : undefined,
        station_code: station?.station_code,
        start_time: new Date(),
        last_activity_time: new Date(),
        current_order_id: dto.order_id ? BigInt(dto.order_id) : undefined,
        status: 'STATION_ASSIGNED',
      },
    });

    await this.prisma.packing_session_status_history.create({
      data: {
        tenant_id: tenantId,
        session_id: session.id,
        current_status: 'STATION_ASSIGNED',
        changed_by: dto.user_id,
      },
    });

    if (station) {
      await this.prisma.packing_stations.updateMany({
        where: { tenant_id: tenantId, station_id: station.station_id },
        data: { is_available: false },
      });
    }

    return this.findSessionById(tenantId, session.id);
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
   * Creates packing slip, packing slip items, auto-detects shortage (GAP-5.1),
   * and handles LPN nesting (GAP-9.1).
   */
  async packItems(tenantId: string, sessionId: bigint, dto: any) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    const orderId = dto.order_id || session.current_order_id;
    if (!orderId) throw new BadRequestException('No order assigned to session');

    if (!session.facility_id) throw new BadRequestException('Session missing facility_id');

    const slip = await this.prisma.packing_slips.create({
      data: {
        tenant_id: tenantId,
        facility_id: session.facility_id,
        packing_slip_number: dto.packing_slip_number || `SLIP-${session.session_number}-${(session.cartons_completed || 0) + 1}`,
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
          picking_task_id: item.picking_task_id ? BigInt(item.picking_task_id) : undefined,
          product_id: BigInt(item.productId),
          quantity_packed: item.quantity_packed,
          uom_id: item.uom_id ? BigInt(item.uom_id) : BigInt(1),
          lot_number: item.lot_number,
          serial_numbers_json: item.serial_numbers ? JSON.stringify(item.serial_numbers) : undefined,
          container_id: item.container_id ? BigInt(item.container_id) : undefined,
        },
      });
    }

    // GAP-5.1: Auto-detect shortage
    const shortages = await this.detectShortage(tenantId, orderId, items);
    for (const s of shortages) {
      await this.prisma.packing_exceptions.create({
        data: {
          tenant_id: tenantId,
          facility_id: session.facility_id,
          session_id: sessionId,
          order_id: orderId,
          exception_type: 'SHORTAGE',
          product_id: s.productId ? BigInt(s.productId) : undefined,
          expected_qty: s.expectedQty,
          packed_qty: s.packedQty,
          reason_code: 'AUTO_DETECTED',
          status: 'OPEN',
          notes: `Auto-detected: packed ${s.packedQty} of ${s.expectedQty} for product ${s.productId}`,
        },
      });
    }

    // GAP-9.1: Nest pick LPNs into this carton
    if (dto.pick_lpn_ids && Array.isArray(dto.pick_lpn_ids)) {
      const slipLpnId = dto.carton_lpn_id ? BigInt(dto.carton_lpn_id) : null;
      if (slipLpnId) {
        for (const pickLpnId of dto.pick_lpn_ids) {
          try {
            await this.nestPickLpn(tenantId, slipLpnId, BigInt(pickLpnId));
          } catch (e) {
            this.logger.warn(`LPN nesting failed for pickLpn ${pickLpnId}: ${e.message}`);
          }
        }
      }
    }

    // Create or assign container
    let containerId: bigint | undefined;
    if (dto.container_code) {
      const container = await this.prisma.packing_containers.create({
        data: {
          tenant_id: tenantId,
          facility_id: session.facility_id,
          container_code: dto.container_code,
          container_type: dto.container_type || 'BOX',
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

    return { slip, containerId, shortagesDetected: shortages.length };
  }

  /**
   * Close carton — generate shipping LPN, update order to PACKED, return label data.
   * GAP-8.1: Generate packing slip data alongside label.
   * GAP-9.2: Consume nested LPNs (NESTED → CONSUMED).
   * APP-PACK-A: Update shipment status if last carton.
   * APP-PACK-H: Assign tracking number stub.
   */
  async closeCarton(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');

    const orderId = dto.order_id || session.current_order_id;
    if (!orderId) throw new BadRequestException('No order assigned to session');

    // Find or create the shipping LPN
    const lpnNumber = dto.carton_barcode || `CARTON-${session.session_number}-${(session.cartons_completed || 0) + 1}`;
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
          product_id: dto.product_id ? BigInt(dto.product_id) : null,
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
    let shipment: any = null;
    if (order) {
      shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, order_id: orderId },
      });
      if (shipment) {
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { assigned_shipment_id: shipment.shipment_id },
        });

        // APP-PACK-H: Assign tracking number stub
        const trackingNumber = `TRK-${lpnNumber}-${Date.now().toString(36).toUpperCase()}`;
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { updated_at: new Date() },
        });
        await this.prisma.outbound_shipments.updateMany({
          where: { tenant_id: tenantId, shipment_id: shipment.shipment_id },
          data: { tracking_number: trackingNumber },
        });
      }
    }

    // GAP-9.2: Check all pick LPNs for the order are nested before closing
    const unnestedPickLpns = await this.prisma.license_plate_numbers.count({
      where: { tenant_id: tenantId, facility_id: facilityId, assigned_shipment_id: lpn.assigned_shipment_id, status: 'PICKED' },
    });
    if (unnestedPickLpns > 0 && !dto.force_close) {
      return { blocked: true, message: `${unnestedPickLpns} pick LPNs not yet nested into carton`, unnestedCount: unnestedPickLpns };
    }

    // GAP-9.2: Consume nested pick LPNs
    const nestedLpns = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, parent_lpn_id: lpn.lpn_id, status: 'NESTED' },
    });
    for (const nlpn of nestedLpns) {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, lpn_id: nlpn.lpn_id },
        data: { status: 'CONSUMED', updated_at: new Date() },
      });
    }

    // Update order status to PACKED
    await this.prisma.sales_orders.updateMany({
      where: { tenant_id: tenantId, order_id: orderId },
      data: { status: 'PACKED' },
    });

    // APP-PACK-A: Check if shipment is ready
    let allCartonsPacked = true;
    let cartonIndex = 0;
    let totalCartons = 0;
    if (order) {
      const cplan = await this.prisma.packing_carton_plan.findMany({
        where: { tenant_id: tenantId, order_id: orderId },
        orderBy: { carton_index: 'asc' },
      });
      totalCartons = cplan.length;
      cartonIndex = totalCartons > 0 ? (cplan.filter(c => c.status === 'PACKED').length + 1) : 1;
      allCartonsPacked = totalCartons === 0 || cplan.every(c => c.status === 'PACKED');

      // Update carton plan status
      if (totalCartons > 0 && cartonIndex <= totalCartons) {
        await this.prisma.packing_carton_plan.updateMany({
          where: { tenant_id: tenantId, order_id: orderId, carton_index: cartonIndex },
          data: { status: 'PACKED' },
        });
      }

      if (shipment && allCartonsPacked) {
        await this.prisma.outbound_shipments.updateMany({
          where: { tenant_id: tenantId, shipment_id: shipment.shipment_id },
          data: { status: 'STAGED' },
        });
        await this.prisma.shipment_status_history.create({
          data: {
            tenant_id: tenantId, shipment_id: shipment.shipment_id,
            previous_status: shipment.status as string, current_status: 'STAGED',
            changed_by: 'PACKING_SYSTEM',
          },
        });
      }
    }

    // Generate label placeholder (ZPL stub)
    const labelData = `^XA^FO50,50^ADN,36,20^FD${lpnNumber}^FS^FO50,100^ADN,18,10^FDOrder: ${order?.order_number || orderId}^FS^FO50,150^ADN,18,10^FDCarton: ${cartonIndex || (session.cartons_completed || 0) + 1}^FS^XZ`;

    // GAP-8.1: Generate packing slip data
    let packingSlipData: any = null;
    const slips = await this.prisma.packing_slips.findMany({
      where: { tenant_id: tenantId, session_id: sessionId },
      orderBy: { packing_slip_id: 'desc' },
      take: 1,
    });
    if (slips.length) {
      packingSlipData = await this.generatePackingSlipData(tenantId, slips[0].packing_slip_id);
    }

    // APP-SHIP-L: Create staging work queue entry for pack→stage auto-queue
    await this.prisma.staging_work_queue.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        carton_id: lpn.lpn_id,
        shipment_id: shipment?.shipment_id || null,
        order_id: BigInt(orderId),
        status: 'PENDING_STAGE',
        priority: 0,
      },
    }).catch(() => {});

    this.eventEmitter.emit(
      'carton.packed',
      new CartonPackedEvent({
        tenant_id: tenantId,
        facility_id: facilityId,
        carton_id: lpn.lpn_id,
        session_id: session.id,
        order_id: BigInt(orderId),
        items_packed: session.cartons_completed || 0,
        packed_by: session.user_id || undefined,
      }),
    );

    return {
      lpnId: lpn.lpn_id.toString(),
      lpnNumber: lpn.lpn_number,
      labelData,
      orderId: orderId.toString(),
      orderNumber: order?.order_number || null,
      cartonIndex: cartonIndex || (session.cartons_completed || 0) + 1,
      totalCartons,
      allCartonsPacked,
      packingSlipData,
      nestedLpnsConsumed: nestedLpns.length,
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
    let stationName: string | undefined;
    let orderNumber: string | undefined;
    if (session.station_id) {
      const station = await this.prisma.packing_stations.findFirst({
        where: { tenant_id: tenantId, station_id: session.station_id },
      });
      stationName = station?.station_name;
    }
    if (session.current_order_id) {
      const order = await this.prisma.sales_orders.findFirst({
        where: { tenant_id: tenantId, order_id: session.current_order_id },
      });
      orderNumber = order?.order_number;
    }
    const slips = await this.prisma.packing_slips.findMany({
      where: { tenant_id: tenantId, session_id: sessionId },
    });
    const history = await this.prisma.packing_session_status_history.findMany({
      where: { tenant_id: tenantId, session_id: sessionId },
      orderBy: { changed_at: 'asc' },
    });
    return { ...session, station_name: stationName, order_number: orderNumber, packingSlips: slips, statusHistory: history };
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

  // GAP-1: Directed pack work (APP-PACK-E: auto-assign totes to session)
  // GAP-2.3: Integrate cartonization into pack flow
  async getNextPackWork(tenantId: string, facilityId: bigint, stationId: bigint, userId: string, sessionId?: bigint) {
    const order = await this.prisma.sales_orders.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, status: 'PICKED' },
      orderBy: { created_at: 'asc' },
    });
    if (!order) return null;
    const pickLpns = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, assigned_shipment_id: order.order_id, status: 'PICKED' },
    });
    // APP-PACK-E: Auto-assign totes to the active session
    if (sessionId && pickLpns.length) {
      try {
        await this.assignTotesToSession(tenantId, facilityId, sessionId, pickLpns.map(l => l.lpn_id));
      } catch (e) {
        this.logger.warn(`Tote assignment failed: ${e.message}`);
      }
    }
    // GAP-2.3: Run cartonization and store carton plan if not already done
    let cartonPlan = await this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, order_id: order.order_id },
    });
    if (cartonPlan.length === 0) {
      try {
        const cartonizationResult = await this.cartonizationService.calculateCartons(tenantId, facilityId, order.order_id);
        if (cartonizationResult.cartons && cartonizationResult.cartons.length > 0) {
          cartonPlan = await this.cartonizationService.createCartonPlan(tenantId, facilityId, order.order_id, cartonizationResult.cartons);
          // Update session with planned cartons count
          if (sessionId) {
            await this.prisma.packing_sessions.updateMany({
              where: { tenant_id: tenantId, id: sessionId },
              data: { planned_cartons: cartonPlan.length, current_order_id: order.order_id },
            }).catch(() => {});
          }
        }
      } catch (e) {
        this.logger.warn(`Cartonization failed for order ${order.order_id}: ${e.message}`);
      }
    }
    return { order, pickLpns, cartonPlan: cartonPlan.length ? cartonPlan : null };
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
        session_id: sessionId, order_id: BigInt(dto.order_id),
        exception_type: 'SHORTAGE',
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        expected_qty: dto.expected_qty, packed_qty: dto.packed_qty,
        reason_code: dto.reason_code, status: 'OPEN',
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
        session_id: sessionId, order_id: BigInt(dto.order_id),
        exception_type: 'DAMAGE',
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        expected_qty: dto.expected_qty, packed_qty: 0,
        reason_code: dto.reason_code || 'DAMAGE', status: 'OPEN',
        notes: dto.notes,
      },
    });
    await this.prisma.quality_holds.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId,
        hold_number: `HOLD-PACK-${Date.now()}`,
        reference_type: 'PACKING', reference_id: exception.exception_id,
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        hold_reason: dto.reason_code || 'PACKING_DAMAGE',
        hold_reason_code: 'PACKING_DAMAGE',
        placed_by_user_id: dto.user_id || '', affected_quantity: dto.expected_qty || 0,
        status: 'OPEN',
      },
    });

    // GAP-6.1: Auto-create replacement pick task for damaged quantity
    if (dto.product_id && dto.expected_qty > 0) {
      try {
        await this.createReplacementPick(tenantId, facilityId, BigInt(dto.order_id), BigInt(dto.product_id), Number(dto.expected_qty));
      } catch (e) {
        this.logger.warn(`Replacement pick creation failed: ${e.message}`);
      }
    }

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
    await this.prisma.packing_exceptions.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: { status: 'RESOLVED', resolved_by: supervisorId, resolved_at: new Date() },
    });
    return exc;
  }

  async rejectException(tenantId: string, exceptionId: bigint, supervisorId: string) {
    const exc = await this.prisma.packing_exceptions.findFirst({ where: { tenant_id: tenantId, exception_id: exceptionId } });
    if (!exc) throw new BadRequestException('Exception not found');
    await this.prisma.packing_exceptions.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: { status: 'RESOLVED', resolved_by: supervisorId, resolved_at: new Date(), notes: 'Rejected by supervisor' },
    });
    return exc;
  }

  // GAP-3: Verify carton contents before close
  async verifyCartonContents(tenantId: string, cartonLpnId: bigint, orderId: bigint) {
    const cartonLpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: cartonLpnId },
    });
    if (!cartonLpn) throw new BadRequestException('Carton LPN not found');

    const plan = await this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { carton_index: 'asc' },
    });

    const slips = await this.prisma.packing_slips.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    const slipIds = slips.map(s => s.packing_slip_id);
    const slipItems = slipIds.length
      ? await this.prisma.packing_slip_items.findMany({
          where: { tenant_id: tenantId, packing_slip_id: { in: slipIds } },
        })
      : [];

    const plannedItems: { productId: number; quantity: number }[] = [];
    for (const p of plan) {
      if (p.items_json) {
        const items = p.items_json as any[];
        for (const item of items) {
          plannedItems.push({ productId: Number(item.productId), quantity: Number(item.quantity) });
        }
      }
    }

    const packedMap = new Map<number, number>();
    for (const si of slipItems) {
      const pid = Number(si.product_id);
      packedMap.set(pid, (packedMap.get(pid) || 0) + Number(si.quantity_packed));
    }

    const matched: any[] = [];
    const missing: any[] = [];
    const extra: any[] = [];

    for (const pi of plannedItems) {
      const packedQty = packedMap.get(pi.productId) || 0;
      matched.push({ productId: pi.productId, expectedQty: pi.quantity, packedQty });
      if (packedQty < pi.quantity) {
        missing.push({ productId: pi.productId, expectedQty: pi.quantity, packedQty, shortQty: pi.quantity - packedQty });
      }
    }

    for (const [productId, packedQty] of packedMap.entries()) {
      if (!plannedItems.find(p => p.productId === productId)) {
        extra.push({ productId, packedQty });
      }
    }

    return { isComplete: missing.length === 0 && extra.length === 0, missing, extra, matched };
  }

  // GAP-4.3: Weight tolerance validation
  async validateWeightTolerance(tenantId: string, orderId: bigint, capturedWeightKg: number, tolerancePct: number = 10) {
    const orderLines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    const productIds = orderLines.map(l => l.product_id);
    const products = await this.prisma.products.findMany({
      where: { tenant_id: tenantId, product_id: { in: productIds } },
    });
    const productMap = new Map(products.map(p => [p.product_id, p]));

    let expectedWeight = 0;
    for (const line of orderLines) {
      const prod = productMap.get(line.product_id);
      if (prod?.weight) expectedWeight += Number(prod.weight) * Number(line.requested_quantity);
    }

    if (expectedWeight === 0) return { isWithinTolerance: true, expectedWeight, capturedWeight: capturedWeightKg, deviationPct: 0 };

    const deviationPct = Math.abs(capturedWeightKg - expectedWeight) / expectedWeight * 100;
    const isWithinTolerance = deviationPct <= tolerancePct;

    return { isWithinTolerance, expectedWeight, capturedWeight: capturedWeightKg, deviationPct: Math.round(deviationPct * 100) / 100 };
  }

  // GAP-8: Generate packing slip data
  async generatePackingSlipData(tenantId: string, slipId: bigint) {
    const slip = await this.prisma.packing_slips.findFirst({
      where: { tenant_id: tenantId, packing_slip_id: slipId },
    });
    if (!slip) throw new BadRequestException('Packing slip not found');

    const items = await this.prisma.packing_slip_items.findMany({
      where: { tenant_id: tenantId, packing_slip_id: slipId },
    });

    const order = slip.order_id
      ? await this.prisma.sales_orders.findFirst({ where: { tenant_id: tenantId, order_id: slip.order_id } })
      : null;

    const productIds = items.map(i => i.product_id);
    const products = productIds.length
      ? await this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map(p => [p.product_id, p]));

    return {
      packingSlipNumber: slip.packing_slip_number,
      orderNumber: order?.order_number || null,
      orderDate: order?.order_date || null,
      deliveryAddress: order ? {
        line1: order.delivery_address_line1,
        city: order.delivery_city,
        state: order.delivery_state_province,
        postalCode: order.delivery_postal_code,
        countryCode: order.delivery_country_code,
      } : null,
      items: items.map(i => ({
        productCode: productMap.get(i.product_id)?.product_code || null,
        productName: productMap.get(i.product_id)?.product_name || null,
        quantityPacked: Number(i.quantity_packed),
        uomId: Number(i.uom_id),
      })),
      weight: slip.weight ? Number(slip.weight) : null,
      volume: slip.volume ? Number(slip.volume) : null,
    };
  }

  // GAP-9.2: Close carton with nested LPN consumption
  async closeCartonWithConsumption(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const result = await this.closeCarton(tenantId, facilityId, sessionId, dto);

    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    const orderId = dto.order_id || session?.current_order_id;
    const cartonLpnId = (result as any).lpnId;
    if (orderId && cartonLpnId) {
      const nestedLpns = await this.prisma.license_plate_numbers.findMany({
        where: { tenant_id: tenantId, parent_lpn_id: BigInt(cartonLpnId), status: 'NESTED' },
      });
      for (const lpn of nestedLpns) {
        await this.prisma.license_plate_numbers.updateMany({
          where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
          data: { status: 'CONSUMED', updated_at: new Date() },
        });
      }
    }

    return result;
  }

  // APP-PACK-A: Check if shipment is ready after carton close
  async updateShipmentPackingStatus(tenantId: string, facilityId: bigint, orderId: bigint) {
    const plan = await this.prisma.packing_carton_plan.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { carton_index: 'asc' },
    });
    const allPacked = plan.every(p => p.status === 'PACKED');
    const cartonIndex = plan.filter(p => p.status === 'PACKED').length;
    if (plan.length > 0 && !allPacked) {
      return { allCartonsPacked: false, cartonIndex, totalCartons: plan.length };
    }
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, order_id: orderId },
    });
    if (shipment && allPacked) {
      await this.prisma.outbound_shipments.updateMany({
        where: { tenant_id: tenantId, shipment_id: shipment.shipment_id },
        data: { status: 'STAGED' },
      });
      await this.prisma.shipment_status_history.create({
        data: {
          tenant_id: tenantId, shipment_id: shipment.shipment_id,
          previous_status: shipment.status as string, current_status: 'STAGED',
          changed_by: 'PACKING_SYSTEM',
        },
      });
    }
    return { allCartonsPacked: allPacked, cartonIndex, totalCartons: plan.length };
  }

  // APP-PACK-D: Validate scanned LPN is assigned to the packing session
  async validateToteForSession(tenantId: string, pickLpnId: bigint, sessionId: bigint) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, lpn_id: pickLpnId },
    });
    if (!lpn) return { valid: false, message: 'LPN not found' };
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) return { valid: false, message: 'Session not found' };
    if (lpn.assigned_shipment_id && session.current_order_id) {
      const order = await this.prisma.sales_orders.findFirst({
        where: { tenant_id: tenantId, order_id: session.current_order_id },
      });
      const shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, order_id: session.current_order_id },
      });
      if (shipment && lpn.assigned_shipment_id !== shipment.shipment_id) {
        return { valid: false, message: `WRONG LPN: Expected LPN assigned to shipment ${shipment.shipment_number}`, expected: shipment.shipment_number, scanned: lpn.lpn_number };
      }
    }
    return { valid: true, lpn };
  }

  // APP-PACK-E: Assign totes to station on getNextPackWork
  async assignTotesToSession(tenantId: string, facilityId: bigint, sessionId: bigint, pickLpnIds: bigint[]) {
    const session = await this.prisma.packing_sessions.findFirst({
      where: { tenant_id: tenantId, id: sessionId },
    });
    if (!session) throw new BadRequestException('Session not found');
    for (const lpnId of pickLpnIds) {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, lpn_id: lpnId },
        data: { assigned_shipment_id: session.current_order_id || undefined, updated_at: new Date() },
      });
    }
    return { assigned: pickLpnIds.length };
  }

  // APP-PACK-F: List packing damage codes — query packing_damage_codes table
  async getDamageCodes(tenantId: string) {
    const codes = await this.prisma.packing_damage_codes.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { code: 'asc' },
    });
    // Fallback to damage_codes with category PACKING if packing_damage_codes is empty
    if (codes.length === 0) {
      return this.prisma.damage_codes.findMany({
        where: { tenant_id: tenantId, is_active: true, category: 'PACKING' },
        orderBy: { code: 'asc' },
      });
    }
    return codes;
  }

  // GAP-5.1: Auto-detect shortage in packItems
  async detectShortage(tenantId: string, orderId: bigint, packedItems: any[]) {
    const orderLines = await this.prisma.sales_order_lines.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
    });
    const shortages: any[] = [];
    for (const line of orderLines) {
      const qtyPacked = packedItems
        .filter(pi => Number(pi.productId) === Number(line.product_id))
        .reduce((sum, pi) => sum + Number(pi.quantityPacked || 0), 0);
      const qtyOrdered = Number(line.requested_quantity);
      if (qtyPacked < qtyOrdered) {
        shortages.push({
          productId: Number(line.product_id),
          expectedQty: qtyOrdered,
          packedQty: qtyPacked,
          shortQty: qtyOrdered - qtyPacked,
          lineId: Number(line.line_id),
        });
      }
    }
    return shortages;
  }

  // GAP-7.2: List all packing sessions (web)
  async getSessions(tenantId: string, facilityId: bigint) {
    const sessions = await this.prisma.packing_sessions.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
      orderBy: { start_time: 'desc' },
      take: 50,
    });
    const stationIds = sessions.map(s => s.station_id).filter(Boolean) as bigint[];
    const orderIds = sessions.map(s => s.current_order_id).filter(Boolean) as bigint[];
    const [stations, orders] = await Promise.all([
      stationIds.length ? this.prisma.packing_stations.findMany({ where: { tenant_id: tenantId, station_id: { in: stationIds } } }) : [],
      orderIds.length ? this.prisma.sales_orders.findMany({ where: { tenant_id: tenantId, order_id: { in: orderIds } } }) : [],
    ]);
    const stationMap = new Map<bigint, string>(stations.map(s => [s.station_id, s.station_name] as [bigint, string]));
    const orderMap = new Map<bigint, string>(orders.map(o => [o.order_id, o.order_number] as [bigint, string]));
    return sessions.map(s => ({
      ...s,
      station_name: s.station_id ? stationMap.get(s.station_id) : undefined,
      order_number: s.current_order_id ? orderMap.get(s.current_order_id) : undefined,
    }));
  }

  // GAP-8.3: Get packing slip by order (web)
  async getPackingSlipsByOrder(tenantId: string, orderId: bigint) {
    const slips = await this.prisma.packing_slips.findMany({
      where: { tenant_id: tenantId, order_id: orderId },
      orderBy: { packing_slip_id: 'asc' },
    });
    const slipIds = slips.map(s => s.packing_slip_id);
    const items = slipIds.length
      ? await this.prisma.packing_slip_items.findMany({ where: { tenant_id: tenantId, packing_slip_id: { in: slipIds } } })
      : [];
    const order = orderId ? await this.prisma.sales_orders.findFirst({ where: { tenant_id: tenantId, order_id: orderId } }) : null;
    return { slips: slips.map(s => ({ ...s, order_number: order?.order_number })), items };
  }

  // GAP-7.2: List all exceptions (web)
  async getExceptions(tenantId: string, facilityId: bigint, status?: string) {
    const where: any = { tenant_id: tenantId, facility_id: facilityId };
    if (status) where.status = status;
    return this.prisma.packing_exceptions.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  // APP-PACK-C: Request carton type override
  async requestCartonOverride(tenantId: string, facilityId: bigint, sessionId: bigint, dto: any) {
    const exception = await this.prisma.packing_exceptions.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId,
        session_id: sessionId, order_id: BigInt(dto.order_id),
        exception_type: 'CARTON_TYPE_OVERRIDE',
        reason_code: dto.reason_code || 'CARTON_OVERRIDE',
        status: 'OPEN',
        notes: `Requested carton type: ${dto.requested_carton_type}. Reason: ${dto.reason || ''}`,
      },
    });
    return exception;
  }

  // GAP-6: Create replacement pick task for damage
  async createReplacementPick(tenantId: string, facilityId: bigint, orderId: bigint, productId: bigint, quantity: number, uomId: bigint = BigInt(1)) {
    const task = await this.prisma.picking_tasks.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        task_number: `REPL-${Date.now()}`,
        order_id: orderId,
        product_id: productId,
        quantity_to_pick: quantity,
        uom_id: uomId,
        status: 'AVAILABLE',
        priority: 99,
      },
    });
    return task;
  }

  // APP-PACK-G: Quality feedback loop — report wrong item during packing
  async reportWrongItem(tenantId: string, facilityId: bigint, sessionId: bigint, orderId: bigint, productId: bigint, pickTaskId: bigint, reasonCode: string) {
    // Create WRONG_ITEM exception
    const exception = await this.prisma.packing_exceptions.create({
      data: {
        tenant_id: tenantId, facility_id: facilityId, session_id: sessionId,
        order_id: orderId, exception_type: 'WRONG_ITEM', product_id: productId,
        reason_code: reasonCode || 'WRONG_ITEM', status: 'OPEN',
        notes: `Pick task ${pickTaskId} put wrong item into tote`,
      },
    });
    // Increment pick task error count for quality tracking
    const pickTask = await this.prisma.picking_tasks.findFirst({ where: { tenant_id: tenantId, task_id: pickTaskId } });
    if (pickTask) {
      const currentErrors = Number((pickTask as any).error_count || 0);
      await this.prisma.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: pickTaskId },
        data: { notes: `Quality issue: wrong item reported. Error count: ${currentErrors + 1}` } as any,
      }).catch(() => {});
    }
    // Update session exceptions count
    await this.prisma.packing_sessions.updateMany({
      where: { tenant_id: tenantId, id: sessionId },
      data: { exceptions_count: { increment: 1 } },
    }).catch(() => {});
    return { exceptionId: exception.exception_id.toString(), message: 'Wrong item reported and pick task flagged' };
  }

  // APP-PACK-G: Get picking quality report
  async getPickingQualityReport(tenantId: string, facilityId: bigint) {
    const wrongItemExceptions = await this.prisma.packing_exceptions.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, exception_type: 'WRONG_ITEM' },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    return {
      totalWrongItems: wrongItemExceptions.length,
      exceptions: wrongItemExceptions.map(e => ({
        exceptionId: e.exception_id.toString(),
        orderId: e.order_id?.toString(),
        productId: e.product_id?.toString(),
        reasonCode: e.reason_code,
        status: e.status,
        createdAt: e.created_at,
      })),
    };
  }

  // APP-PACK-H: Carrier API integration — request tracking number (stub implementation)
  async requestTrackingNumber(tenantId: string, shipmentId: bigint, carrierId?: bigint) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');
    // Stub: generate tracking number — in production this would call carrier API
    const trackingNumber = `TRK-${shipment.shipment_number}-${Date.now().toString(36).toUpperCase()}`;
    // Store tracking number on shipment
    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: { tracking_number: trackingNumber },
    });
    return { trackingNumber, carrierId: carrierId?.toString() || null, shipmentId: shipmentId.toString() };
  }
}
