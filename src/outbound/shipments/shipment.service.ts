import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a shipment from a sales order or directly.
   * Auto-populates carrier info, delivery address from order.
   */
  async delete(tenantId: string, shipmentId: bigint) {
    return this.prisma.outbound_shipments.deleteMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
  }

  async create(tenantId: string, dto: any) {
    let carrierId: bigint | undefined;
    let carrierCode: string | undefined;
    let carrierName: string | undefined;

    if (dto.carrierId) {
      const carrier = await this.prisma.carriers.findFirst({
        where: { tenant_id: tenantId, carrier_id: BigInt(dto.carrierId) },
      });
      if (carrier) {
        carrierId = carrier.carrier_id;
        carrierCode = carrier.carrier_code;
        carrierName = carrier.carrier_name;
      }
    }

    // If orderId given, pull delivery address from sales order
    let deliveryFields: any = {};
    if (dto.orderId) {
      const order = await this.prisma.sales_orders.findFirst({
        where: { tenant_id: tenantId, order_id: BigInt(dto.orderId) },
      });
      if (order) {
        deliveryFields = {
          delivery_address_line1: order.delivery_address_line1,
          delivery_address_line2: order.delivery_address_line2,
          delivery_city: order.delivery_city,
          delivery_state_province: order.delivery_state_province,
          delivery_postal_code: order.delivery_postal_code,
          delivery_country_code: order.delivery_country_code,
          delivery_contact_name: order.delivery_contact_name,
          delivery_contact_phone: order.delivery_contact_phone,
          delivery_instructions: order.delivery_instructions,
        };
      }
    }

    const shipment = await this.prisma.outbound_shipments.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        shipment_number: dto.shipmentNumber || `SHIP-${Date.now()}`,
        order_id: dto.orderId ? BigInt(dto.orderId) : undefined,
        client_id: dto.clientId ? BigInt(dto.clientId) : BigInt(0),
        carrier_id: carrierId,
        carrier_code: dto.carrierCode || carrierCode,
        carrier_name: dto.carrierName || carrierName,
        service_level: dto.serviceLevel,
        scheduled_ship_date: dto.scheduledShipDate ? new Date(dto.scheduledShipDate) : undefined,
        driver_name: dto.driverName,
        trailer_number: dto.trailerNumber,
        total_cartons: dto.totalCartons || 0,
        ...deliveryFields,
      },
    });

    return this.findShipmentById(tenantId, shipment.shipment_id);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.carrierId) where.carrier_id = BigInt(query.carrierId);
    if (query.search) {
      where.OR = [
        { shipment_number: { contains: query.search, mode: 'insensitive' } },
        { carrier_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.outbound_shipments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduled_ship_date: 'asc' },
      }),
      this.prisma.outbound_shipments.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findShipmentById(tenantId: string, shipmentId: bigint) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) return null;
    const items = await this.prisma.outbound_shipment_items.findMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    const labels = await this.prisma.shipping_labels.findMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    const history = await this.prisma.shipment_status_history.findMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      orderBy: { changed_at: 'asc' },
    });
    return { ...shipment, items, labels, statusHistory: history };
  }

  /** Assign a carrier to the shipment */
  async assignCarrier(tenantId: string, shipmentId: bigint, carrierId: bigint) {
    const carrier = await this.prisma.carriers.findFirst({
      where: { tenant_id: tenantId, carrier_id: carrierId, is_active: true },
    });
    if (!carrier) throw new BadRequestException('Carrier not found or inactive');

    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: {
        carrier_id: carrier.carrier_id,
        carrier_code: carrier.carrier_code,
        carrier_name: carrier.carrier_name,
        status: 'CARRIER_ASSIGNED',
      },
    });

    await this.recordStatusChange(tenantId, shipmentId, 'CARRIER_ASSIGNED');
    return this.findShipmentById(tenantId, shipmentId);
  }

  /** Stage the shipment at a dock door */
  async stageShipment(tenantId: string, shipmentId: bigint, stagingLocationId: bigint) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: { status: 'STAGED' },
    });

    // Update LPNs to staged
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_shipment_id: shipmentId },
      data: { status: 'STAGED', staging_location_id: stagingLocationId, staged_at: new Date() },
    });

    await this.recordStatusChange(tenantId, shipmentId, 'STAGED');
    return this.findShipmentById(tenantId, shipmentId);
  }

  /** Load shipment onto a vehicle/load */
  async loadShipment(tenantId: string, shipmentId: bigint, loadId?: bigint) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    const updateData: any = { status: 'LOADED' };

    if (loadId) {
      const load = await this.prisma.loads.findFirst({
        where: { tenant_id: tenantId, load_id: loadId },
      });
      if (!load) throw new BadRequestException('Load not found');
      updateData.load_id = loadId;

      // Link via load_shipments
      const existing = await this.prisma.load_shipments.findFirst({
        where: { tenant_id: tenantId, load_id: loadId, shipment_id: shipmentId },
      });
      if (!existing) {
        await this.prisma.load_shipments.create({
          data: {
            tenant_id: tenantId,
            facility_id: shipment.facility_id,
            load_id: loadId,
            shipment_id: shipmentId,
          },
        });
      }
    }

    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: updateData,
    });

    // Update LPNS to loaded
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_shipment_id: shipmentId },
      data: { status: 'LOADED', loaded_at: new Date() },
    });

    await this.recordStatusChange(tenantId, shipmentId, 'LOADED');
    return this.findShipmentById(tenantId, shipmentId);
  }

  /** Confirm shipment as shipped — update status, record tracking */
  async shipShipment(tenantId: string, shipmentId: bigint, dto: any) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    if (!shipment) throw new BadRequestException('Shipment not found');

    await this.prisma.outbound_shipments.updateMany({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
      data: {
        status: 'SHIPPED',
        shipped_date: new Date(),
        tracking_number: dto.trackingNumber || shipment.tracking_number,
        tracking_url: dto.trackingUrl || shipment.tracking_url,
        pro_number: dto.proNumber || shipment.pro_number,
        driver_name: dto.driverName || shipment.driver_name,
        total_cartons: dto.totalCartons || shipment.total_cartons,
        total_weight: dto.totalWeight || shipment.total_weight,
        total_volume: dto.totalVolume || shipment.total_volume,
        number_of_packages: dto.numberOfPackages || shipment.number_of_packages,
      },
    });

    // Generate shipping label
    if (dto.generateLabel !== false) {
      await this.prisma.shipping_labels.create({
        data: {
          tenant_id: tenantId,
          facility_id: shipment.facility_id,
          shipment_id: shipmentId,
          tracking_number: dto.trackingNumber || shipment.tracking_number || `TRK-${Date.now()}`,
          service_level: shipment.service_level,
          weight: dto.totalWeight || shipment.total_weight,
          status: 'GENERATED',
          generated_at: new Date(),
        },
      });
    }

    // Update LPNs to shipped
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_shipment_id: shipmentId },
      data: { status: 'SHIPPED' },
    });

    // Update sales order status to SHIPPED
    if (shipment.order_id) {
      await this.prisma.sales_orders.updateMany({
        where: { tenant_id: tenantId, order_id: shipment.order_id },
        data: { status: 'SHIPPED', shipped_date: new Date() },
      });
    }

    await this.recordStatusChange(tenantId, shipmentId, 'SHIPPED');
    return this.findShipmentById(tenantId, shipmentId);
  }

  /** Generate manifest for a load */
  async generateManifest(tenantId: string, loadId: bigint) {
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, load_id: loadId },
    });
    if (!load) throw new BadRequestException('Load not found');

    const loadShipments = await this.prisma.load_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
    });

    const shipmentIds = loadShipments.map((ls) => ls.shipment_id);
    const shipments = shipmentIds.length
      ? await this.prisma.outbound_shipments.findMany({
          where: { tenant_id: tenantId, shipment_id: { in: shipmentIds } },
        })
      : [];

    return {
      loadNumber: load.load_number,
      vehicleNumber: load.vehicle_number,
      driverName: load.driver_name,
      driverPhone: load.driver_phone,
      carrierName: load.carrier_name,
      totalShipments: shipments.length,
      shipments: shipments.map((s) => ({
        shipmentNumber: s.shipment_number,
        trackingNumber: s.tracking_number,
        proNumber: s.pro_number,
        totalCartons: s.total_cartons,
        totalWeight: s.total_weight,
      })),
      generatedAt: new Date(),
    };
  }

  private async recordStatusChange(tenantId: string, shipmentId: bigint, newStatus: string) {
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: shipmentId },
    });
    await this.prisma.shipment_status_history.create({
      data: {
        tenant_id: tenantId,
        shipment_id: shipmentId,
        previous_status: shipment?.status || 'CREATED',
        current_status: newStatus,
        changed_at: new Date(),
      },
    });
  }
}
