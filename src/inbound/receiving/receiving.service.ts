import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { receipt_status } from '@prisma/client';

const VARIANCE_NONE = 'NONE';
const VARIANCE_OVER = 'OVER';
const VARIANCE_SHORT = 'SHORT';
const VARIANCE_DAMAGED = 'DAMAGED';

const DISPOSITION_HOLD = 'HOLD';
const DISPOSITION_SCRAP = 'SCRAP';
const DISPOSITION_RTV = 'RETURN_TO_VENDOR';

@Injectable()
export class ReceivingService {
  private readonly logger = new Logger(ReceivingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReceipt(tenantId: string, dto: any) {
    return this.prisma.goods_receipts.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        receipt_number: dto.receiptNumber,
        receipt_name: dto.receiptName,
        description: dto.description,
        po_number: dto.poNumber,
        asn_number: dto.asnNumber,
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
        expected_date: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        notes: dto.notes,
        inbound_for_client_id: dto.inboundForClientId ? BigInt(dto.inboundForClientId) : undefined,
      },
    });
  }

  async findAllReceipts(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { receipt_number: { contains: query.search, mode: 'insensitive' } },
        { po_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.goods_receipts.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.goods_receipts.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async delete(tenantId: string, receiptId: bigint) {
    return this.prisma.goods_receipts.deleteMany({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });
  }

  async findReceiptById(tenantId: string, receiptId: bigint) {
    const receipt = await this.prisma.goods_receipts.findFirst({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });
    if (!receipt) return null;
    const lines = await this.prisma.goods_receipt_lines.findMany({
      where: { tenant_id: tenantId, receipt_id: receiptId },
      orderBy: { receipt_line_id: 'asc' },
    });
    return { ...receipt, lines };
  }

  /** Lookup expected receiving info by scanning an ASN number (RF) */
  async lookupByAsn(tenantId: string, asnNumber: string, facilityId: bigint) {
    const asn = await this.prisma.advance_ship_notices.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, asn_number: asnNumber },
    });
    if (!asn) return null;
    const lines = await this.prisma.asn_lines.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, asn_id: asn.asn_id },
      orderBy: { asn_line_id: 'asc' },
    });
    return { asn, lines };
  }

  /** Lookup expected receiving info by scanning a PO number (RF) */
  async lookupByPo(tenantId: string, poNumber: string, facilityId: bigint) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, po_number: poNumber },
    });
    if (!po) return null;
    const lines = await this.prisma.purchase_order_lines.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, po_id: po.po_id },
      orderBy: { line_number: 'asc' },
    });
    return { po, lines };
  }

  /** Lookup an LPN to find its staging location and product (RF) */
  async lookupByLpn(tenantId: string, facilityId: bigint, lpnBarcode: string) {
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: lpnBarcode, status: 'RECEIVED' },
      include: { other_license_plate_numbers: true },
    });
    if (!lpn) {
      const task = await this.prisma.putaway_tasks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, lpn_barcode: lpnBarcode },
      });
      if (!task) return null;
      const product = await this.prisma.products.findFirst({
        where: { tenant_id: tenantId, product_id: task.product_id },
      });
      return { lpn: null, task, product, fromLocationId: task.from_location_id };
    }
    return { lpn, task: null, product: null, fromLocationId: lpn.staging_location_id };
  }

  /**
   * Receive a line. Classifies variance, updates PO/ASN line received qty,
   * creates inventory transaction, auto-creates goods_receipt_item if staging
   * location provided.
   */
  async receiveLine(tenantId: string, receiptId: bigint, dto: any) {
    const receipt = await this.prisma.goods_receipts.findFirst({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });
    if (!receipt) throw new BadRequestException('Receipt not found');

    const expectedQty = Number(dto.expectedQuantity || 0);
    const receivedQty = Number(dto.receivedQuantity || 0);
    const damagedQty = Number(dto.damagedQuantity || 0);
    const goodQty = Math.max(0, receivedQty - damagedQty);

    let varianceType = VARIANCE_NONE;
    if (damagedQty > 0) {
      varianceType = VARIANCE_DAMAGED;
    } else if (receivedQty > expectedQty) {
      varianceType = VARIANCE_OVER;
    } else if (receivedQty < expectedQty) {
      varianceType = VARIANCE_SHORT;
    }

    const qcRequired = damagedQty > 0 || varianceType !== VARIANCE_NONE;
    const dispositionAction = damagedQty > 0 ? (dto.dispositionAction || DISPOSITION_HOLD) : null;

    // Check if an open line already exists for same product — Manhattan allows
    // multiple receive actions but updates existing line qty instead of creating new
    let line;
    const existingLine = await this.prisma.goods_receipt_lines.findFirst({
      where: {
        tenant_id: tenantId,
        receipt_id: receiptId,
        product_id: BigInt(dto.productId),
        line_status: { in: ['OPEN', 'QC_PENDING'] },
      },
      orderBy: { receipt_line_id: 'desc' },
    });

    if (existingLine) {
      line = await this.prisma.goods_receipt_lines.updateMany({
        where: { tenant_id: tenantId, receipt_line_id: existingLine.receipt_line_id },
        data: {
          expected_quantity: { increment: expectedQty },
          received_quantity: { increment: receivedQty },
          damaged_quantity: { increment: damagedQty },
          line_status: qcRequired ? 'QC_PENDING' : 'OPEN',
          variance_type: varianceType,
          qc_status: qcRequired ? 'PENDING' : 'NOT_REQUIRED',
          disposition_action: dispositionAction,
          lot_number: dto.lotNumber || existingLine.lot_number,
        },
      });
    } else {
      line = await this.prisma.goods_receipt_lines.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          receipt_id: receiptId,
          product_id: BigInt(dto.productId),
          expected_quantity: expectedQty,
          received_quantity: receivedQty,
          damaged_quantity: damagedQty,
          uom_id: BigInt(dto.uomId),
          lot_number: dto.lotNumber,
          expiry_date: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          asn_line_id: dto.asnLineId ? BigInt(dto.asnLineId) : undefined,
          notes: dto.notes,
          line_status: qcRequired ? 'QC_PENDING' : 'OPEN',
          variance_type: varianceType,
          qc_status: qcRequired ? 'PENDING' : 'NOT_REQUIRED',
          disposition_action: dispositionAction,
        },
      });
    }

    // Update PO line received qty
    if (dto.poLineId) {
      await this.prisma.purchase_order_lines.updateMany({
        where: { tenant_id: tenantId, line_id: BigInt(dto.poLineId) },
        data: { received_quantity: { increment: receivedQty } },
      });
    }

    // Update ASN line received qty
    if (dto.asnLineId) {
      await this.prisma.asn_lines.updateMany({
        where: { tenant_id: tenantId, asn_line_id: BigInt(dto.asnLineId) },
        data: { received_quantity: { increment: receivedQty } },
      });
    }

    const stagingLocationId = dto.stagingLocationId ? BigInt(dto.stagingLocationId) : undefined;

    // Create inventory transaction
    if (goodQty > 0) {
      await this.prisma.inventory_transactions.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          reference_type: 'GOODS_RECEIPT',
          reference_id: receipt.receipt_id,
          product_id: BigInt(dto.productId),
          to_location_id: stagingLocationId,
          transaction_type: 'RECEIPT',
          transaction_status: 'COMPLETED',
          quantity: goodQty,
          uom_id: BigInt(dto.uomId),
          reason_code: varianceType === VARIANCE_NONE ? 'STANDARD' : varianceType,
          lot_number: dto.lotNumber,
          reference_document_type: 'GRN',
          reference_document_number: receipt.receipt_number,
        },
      });
    }

    // If staging location known, create goods_receipt_item immediately
    let goodItemId: bigint | undefined;
    if (stagingLocationId && goodQty > 0) {
      const goodItem = await this.prisma.goods_receipt_items.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          receipt_line_id: typeof line === 'object' && 'receipt_line_id' in line
            ? (line as any).receipt_line_id
            : existingLine?.receipt_line_id,
          product_id: BigInt(dto.productId),
          quantity: goodQty,
          uom_id: BigInt(dto.uomId),
          lot_number: dto.lotNumber,
          condition_status: 'GOOD',
          temporary_location_id: stagingLocationId,
        },
      });
      goodItemId = goodItem.receipt_item_id;
    }

    // Generate LPN for each goods_receipt_item (Manhattan: one LPN per pallet/carton received)
    if (goodItemId && stagingLocationId) {
      const lpnNumber = `LPN-${receipt.facility_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      await this.prisma.license_plate_numbers.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          lpn_number: lpnNumber,
          location_id: stagingLocationId,
          staging_location_id: stagingLocationId,
          product_id: BigInt(dto.productId),
          lpn_type: 'CASE',
          status: 'RECEIVED',
          grn_line_id: goodItemId,
          created_by: dto.createdBy || null,
        },
      });
    }

    // Create damaged goods item with disposition
    if (dispositionAction && damagedQty > 0) {
      const damagedItem = await this.prisma.goods_receipt_items.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          receipt_line_id: typeof line === 'object' && 'receipt_line_id' in line
            ? (line as any).receipt_line_id
            : existingLine?.receipt_line_id,
          product_id: BigInt(dto.productId),
          quantity: damagedQty,
          uom_id: BigInt(dto.uomId),
          lot_number: dto.lotNumber,
          condition_status: 'DAMAGED',
          temporary_location_id: stagingLocationId,
          notes: `Disposition: ${dispositionAction}`,
        },
      });

      // Generate LPN for damaged goods as well
      const lpnNumber = `LPN-${receipt.facility_id}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-DMG`;
      await this.prisma.license_plate_numbers.create({
        data: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          lpn_number: lpnNumber,
          location_id: stagingLocationId || 0,
          staging_location_id: stagingLocationId || null,
          product_id: BigInt(dto.productId),
          lpn_type: 'CASE',
          status: 'QUARANTINED',
          grn_line_id: damagedItem.receipt_item_id,
          created_by: dto.createdBy || null,
        },
      });
    }

    // Transition receipt CREATED -> RECEIVING
    if (receipt.status === 'CREATED') {
      await this.prisma.goods_receipts.updateMany({
        where: { tenant_id: tenantId, receipt_id: receiptId },
        data: { status: receipt_status.RECEIVING },
      });
    }

    return { line, varianceType, goodQty, damagedQty };
  }

  /**
   * Complete receipt: close lines, create GR items if not already created,
   * generate putaway tasks, update ASN status.
   */
  async completeReceipt(tenantId: string, receiptId: bigint, stagingLocationId?: bigint) {
    const receipt = await this.prisma.goods_receipts.findFirst({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });
    if (!receipt) throw new BadRequestException('Receipt not found');

    await this.prisma.goods_receipts.updateMany({
      where: { tenant_id: tenantId, receipt_id: receiptId },
      data: { status: receipt_status.COMPLETED, received_date: new Date() },
    });

    // Update ASN status to RECEIVED if ASN reference exists
    if (receipt.asn_number) {
      await this.prisma.advance_ship_notices.updateMany({
        where: { tenant_id: tenantId, facility_id: receipt.facility_id, asn_number: receipt.asn_number },
        data: { status: 'RECEIVED', status_changed_at: new Date() },
      });
    }

    const lines = await this.prisma.goods_receipt_lines.findMany({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });

    for (const line of lines) {
      const receivedQty = Number(line.received_quantity);
      const goodQty = Math.max(0, receivedQty - Number(line.damaged_quantity));

      if (line.line_status !== 'RECEIVED') {
        await this.prisma.goods_receipt_lines.updateMany({
          where: { tenant_id: tenantId, receipt_line_id: line.receipt_line_id },
          data: { line_status: 'RECEIVED' },
        });
      }

      if (goodQty <= 0) continue;

      // Create goods_receipt_item if not already linked by receiveLine
      const existingItem = await this.prisma.goods_receipt_items.findFirst({
        where: { tenant_id: tenantId, receipt_line_id: line.receipt_line_id, condition_status: 'GOOD' },
      });
      if (!existingItem) {
        await this.prisma.goods_receipt_items.create({
          data: {
            tenant_id: tenantId,
            facility_id: receipt.facility_id,
            receipt_line_id: line.receipt_line_id,
            product_id: line.product_id,
            quantity: goodQty,
            uom_id: line.uom_id,
            lot_number: line.lot_number,
            condition_status: 'GOOD',
            temporary_location_id: stagingLocationId || undefined,
          },
        });
      }

      // Auto-generate putaway tasks with Manhattan-style priority (lower = faster)
      if (stagingLocationId) {
        const taskNumber = `PT-${receipt.receipt_number}-${line.receipt_line_id}`;
        const existingTask = await this.prisma.putaway_tasks.findFirst({
          where: { tenant_id: tenantId, task_number: taskNumber },
        });
        if (!existingTask) {
          await this.prisma.putaway_tasks.create({
            data: {
              tenant_id: tenantId,
              facility_id: receipt.facility_id,
              task_number: taskNumber,
              task_name: `Putaway ${line.product_id}`,
              receipt_line_id: line.receipt_line_id,
              product_id: line.product_id,
              quantity: goodQty,
              uom_id: line.uom_id,
              from_location_id: stagingLocationId,
              lot_number: line.lot_number,
              grn_number: receipt.receipt_number,
              priority: line.variance_type === 'DAMAGED' ? 5 : 10,
              status: 'PENDING',
            },
          });
        }
      }
    }

    return this.findReceiptById(tenantId, receiptId);
  }

  /**
   * RF: Assign a dock door to an appointment (Manhattan: scan dock door barcode).
   * Looks up loading dock by dock_code, assigns to appointment, marks dock unavailable.
   */
  async assignDockDoor(tenantId: string, facilityId: bigint, dockCode: string, appointmentId?: string, userId?: string) {
    const dock = await this.prisma.loading_docks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode, is_active: true },
    });
    if (!dock) throw new BadRequestException(`Dock door ${dockCode} not found or inactive`);
    if (!dock.is_available) throw new BadRequestException(`Dock door ${dockCode} is already occupied`);

    // Mark dock as unavailable
    await this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, facility_id: facilityId, dock_id: dock.dock_id },
      data: { is_available: false, updated_at: new Date() },
    });

    // If appointment specified, assign dock to it and check-in
    if (appointmentId) {
      const apt = await this.prisma.dock_appointments.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, appointment_id: BigInt(appointmentId) },
      });
      if (!apt) throw new BadRequestException('Appointment not found');
      if (apt.status !== 'REQUESTED' && apt.status !== 'CONFIRMED') {
        throw new BadRequestException(`Appointment status ${apt.status} cannot be assigned to door`);
      }
      await this.prisma.dock_appointments.updateMany({
        where: { tenant_id: tenantId, appointment_id: apt.appointment_id },
        data: {
          assigned_dock_id: dock.dock_id,
          arrived_at: new Date(),
          status: 'IN_PROGRESS',
          confirmed_by_user_id: userId || null,
          updated_at: new Date(),
        },
      });
    }

    return { dockId: dock.dock_id.toString(), dockCode: dock.dock_code, dockName: dock.dock_name, appointmentId: appointmentId || null };
  }

  /** Start an RF receiving session -- lookup or create GRN and set ARRIVED */
  async startReceivingSession(tenantId: string, dto: any) {
    const facilityId = BigInt(dto.facilityId);

    // Manhattan: validate ASN is routed to the assigned dock door
    if (dto.asnNumber && dto.dockCode) {
      const dock = await this.prisma.loading_docks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dto.dockCode },
      });
      if (dock) {
        const appointment = await this.prisma.dock_appointments.findFirst({
          where: { tenant_id: tenantId, facility_id: facilityId, assigned_dock_id: dock.dock_id, status: 'IN_PROGRESS' },
        });
        if (appointment && appointment.reference_type === 'ASN' && appointment.reference_id) {
          const linkedAsn = await this.prisma.advance_ship_notices.findFirst({
            where: { tenant_id: tenantId, asn_id: appointment.reference_id },
          });
          if (linkedAsn && linkedAsn.asn_number !== dto.asnNumber) {
            throw new BadRequestException(
              `ASN ${dto.asnNumber} is not routed to door ${dto.dockCode} (expected ASN ${linkedAsn.asn_number})`,
            );
          }
        }
      }
    }

    // Try to find existing receipt by ASN or PO
    const existingReceipt = dto.receiptId
      ? await this.prisma.goods_receipts.findFirst({ where: { tenant_id: tenantId, receipt_id: BigInt(dto.receiptId) } })
      : dto.asnNumber
        ? await this.prisma.goods_receipts.findFirst({ where: { tenant_id: tenantId, facility_id: facilityId, asn_number: dto.asnNumber } })
        : dto.poNumber
          ? await this.prisma.goods_receipts.findFirst({ where: { tenant_id: tenantId, facility_id: facilityId, po_number: dto.poNumber } })
          : null;

    // Auto-create receipt if it doesn't exist (Manhattan allows on-the-fly)
    const receipt = existingReceipt ?? await this.prisma.goods_receipts.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        receipt_number: dto.receiptNumber || `GRN-${Date.now()}`,
        receipt_name: dto.receiptName || dto.asnNumber || dto.poNumber,
        po_number: dto.poNumber,
        asn_number: dto.asnNumber,
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
      },
    });

    // Mark as ARRIVED if CREATED
    if (receipt.status === 'CREATED') {
      await this.prisma.goods_receipts.updateMany({
        where: { tenant_id: tenantId, receipt_id: receipt.receipt_id },
        data: { status: receipt_status.ARRIVED },
      });
    }

    return this.findReceiptById(tenantId, receipt.receipt_id);
  }

  /** Blind receiving: receive a product without an existing receipt/doc reference */
  async blindReceive(tenantId: string, facilityId: bigint, dto: any) {
    const receipt = await this.prisma.goods_receipts.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        receipt_number: dto.receiptNumber || `BLIND-${Date.now()}`,
        receipt_name: dto.receiptName || 'Blind Receipt',
        description: dto.description,
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
        status: receipt_status.RECEIVING,
      },
    });

    return this.receiveLine(tenantId, receipt.receipt_id, {
      productId: dto.productId,
      expectedQuantity: 0,
      receivedQuantity: dto.receivedQuantity,
      damagedQuantity: dto.damagedQuantity || 0,
      uomId: dto.uomId,
      lotNumber: dto.lotNumber,
      stagingLocationId: dto.stagingLocationId,
      dispositionAction: dto.dispositionAction,
    });
  }

  /** RF: scan a product barcode during receiving session */
  async scanProduct(tenantId: string, receiptId: bigint, dto: any) {
    const receipt = await this.prisma.goods_receipts.findFirst({
      where: { tenant_id: tenantId, receipt_id: receiptId },
    });
    if (!receipt) throw new BadRequestException('Receipt session not found');

    let product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_code: dto.productCode },
    });
    if (!product) {
      const pb = await this.prisma.product_barcodes.findFirst({
        where: { tenant_id: tenantId, barcode_value: dto.productCode },
        include: { products: true },
      });
      product = pb?.products || null;
    }
    if (!product) throw new BadRequestException('Product not found');

    // Manhattan: validate scanned product is on expected ASN/PO lines
    if (receipt.asn_number) {
      const asn = await this.prisma.advance_ship_notices.findFirst({
        where: { tenant_id: tenantId, facility_id: receipt.facility_id, asn_number: receipt.asn_number },
      });
      if (asn) {
        const asnLine = await this.prisma.asn_lines.findFirst({
          where: { tenant_id: tenantId, asn_id: asn.asn_id, product_id: product.product_id },
        });
        if (!asnLine) {
          throw new BadRequestException(`Product ${product.product_code} is not on the ASN's expected items`);
        }
      }
    } else if (receipt.po_number) {
      const po = await this.prisma.purchase_orders.findFirst({
        where: { tenant_id: tenantId, facility_id: receipt.facility_id, po_number: receipt.po_number },
      });
      if (po) {
        const poLine = await this.prisma.purchase_order_lines.findFirst({
          where: { tenant_id: tenantId, po_id: po.po_id, product_id: product.product_id },
        });
        if (!poLine) {
          throw new BadRequestException(`Product ${product.product_code} is not on the PO's expected items`);
        }
      }
    }

    // Show already-received total + expected from PO/ASN if available
    const existingLines = await this.prisma.goods_receipt_lines.findMany({
      where: { tenant_id: tenantId, receipt_id: receiptId, product_id: product.product_id },
      orderBy: { receipt_line_id: 'asc' },
    });

    const alreadyReceived = existingLines.reduce((s, l) => s + Number(l.received_quantity), 0);

    // Look up expected qty from PO lines
    let expectedTotal = 0;
    if (receipt.po_number) {
      const poLines = await this.prisma.purchase_order_lines.findMany({
        where: {
          tenant_id: tenantId,
          facility_id: receipt.facility_id,
          po_id: (
            await this.prisma.purchase_orders.findFirst({
              where: { tenant_id: tenantId, facility_id: receipt.facility_id, po_number: receipt.po_number },
            })
          )?.po_id || 0,
          product_id: product.product_id,
        },
      });
      expectedTotal = poLines.reduce((s, l) => s + Number(l.ordered_quantity), 0);
    }

    const openLine = existingLines.find((l) => l.line_status === 'OPEN' || l.line_status === 'QC_PENDING');

    return { product, openLine, alreadyReceived, expectedTotal };
  }

  /** RF: set staging location */
  async stageReceipt(tenantId: string, receiptId: bigint, stagingLocationId: string) {
    const receipt = await this.findReceiptById(tenantId, receiptId);
    if (!receipt) throw new Error('Receipt not found');

    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_code: stagingLocationId },
    });
    if (!location) throw new BadRequestException(`Staging location ${stagingLocationId} not found`);

    const lines = receipt.lines || [];
    for (const line of lines) {
      if (line.line_status === 'OPEN' || line.line_status === 'QC_PENDING') {
        const receiptItems = await this.prisma.goods_receipt_items.findMany({
          where: { tenant_id: tenantId, receipt_line_id: line.receipt_line_id },
        });
        for (const item of receiptItems) {
          await this.prisma.license_plate_numbers.updateMany({
            where: { tenant_id: tenantId, grn_line_id: item.receipt_item_id, status: 'RECEIVED' },
            data: { status: 'IN_STAGING', location_id: location.location_id, staging_location_id: location.location_id, staged_at: new Date() },
          });
        }
        if (receiptItems.length > 0) {
          const firstItem = receiptItems[0];
          await this.prisma.inventory_transactions.create({
            data: {
              tenant_id: tenantId,
              facility_id: receipt.facility_id,
              transaction_type: 'PUTAWAY',
              transaction_status: 'COMPLETED',
              reference_type: 'GRN',
              reference_id: receiptId,
              product_id: firstItem.product_id ?? BigInt(0),
              uom_id: BigInt(1),
              from_location_id: location.location_id,
              to_location_id: location.location_id,
              reference_document_type: 'GRN',
              reference_document_number: receipt.receipt_number,
              quantity: line.received_quantity || 0,
              notes: `Staged at ${stagingLocationId}`,
              created_at: new Date(),
            },
          });
        }
      }
    }
    return this.prisma.goods_receipts.update({
      where: { receipt_id: receiptId, tenant_id: tenantId },
      data: { notes: `Staged at location: ${stagingLocationId}` },
    });
  }

  /** RF: confirm received qty */
  async confirmQuantity(tenantId: string, receiptId: bigint, dto: any) {
    return this.receiveLine(tenantId, receiptId, {
      productId: dto.productId,
      expectedQuantity: dto.expectedQuantity || 0,
      receivedQuantity: dto.receivedQuantity,
      damagedQuantity: dto.damagedQuantity || 0,
      uomId: dto.uomId,
      lotNumber: dto.lotNumber,
      poLineId: dto.poLineId,
      asnLineId: dto.asnLineId,
      stagingLocationId: dto.stagingLocationId || dto.fromLocationId,
      dispositionAction: dto.dispositionAction,
    });
  }
}
