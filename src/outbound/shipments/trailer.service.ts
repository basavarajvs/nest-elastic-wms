import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrailerService {
  private readonly logger = new Logger(TrailerService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async enrichTrailerRows(rows: any[]): Promise<any[]> {
    if (!rows.length) return rows;
    const tenantId = rows[0].tenant_id;
    const loadIds = rows.map(r => r.assigned_load_id).filter(Boolean) as bigint[];
    const loadMap = new Map<bigint, string>();
    if (loadIds.length) {
      const loads = await this.prisma.loads.findMany({
        where: { tenant_id: tenantId, load_id: { in: loadIds } },
        select: { load_id: true, load_number: true },
      });
      loads.forEach(l => loadMap.set(l.load_id, l.load_number));
    }
    return rows.map(r => ({ ...r, load_number: r.assigned_load_id ? loadMap.get(r.assigned_load_id) : undefined }));
  }

  private async enrichTrailerRow(r: any): Promise<any> {
    if (!r || !r.assigned_load_id) return r;
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: r.tenant_id, load_id: r.assigned_load_id },
      select: { load_number: true },
    });
    return { ...r, load_number: load?.load_number };
  }

  async create(tenantId: string, dto: any) {
    const row = await this.prisma.trailers.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        trailer_number: dto.trailer_number,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : undefined,
        trailer_type: dto.trailer_type || 'DRY_VAN',
        status: dto.status || 'ARRIVED',
        is_active: dto.is_active ?? true,
        max_weight_kg: dto.max_weight_kg,
        max_volume_cbm: dto.max_volume_cbm,
        max_pallets: dto.max_pallets,
        max_cartons: dto.max_cartons,
        seal_number: dto.seal_number,
        arrival_time: dto.arrival_time ? new Date(dto.arrival_time) : new Date(),
        notes: dto.notes,
      },
    });
    return this.enrichTrailerRow(row);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, ...(query.facilityId ? { facility_id: BigInt(query.facilityId) } : {})  };
    if (query.status) where.status = query.status;
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (query.search) {
      where.OR = [
        { trailer_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.trailers.findMany({ where, skip, take: limit, orderBy: { arrival_time: 'desc' } }),
      this.prisma.trailers.count({ where }),
    ]);
    const facilityIds = [...new Set(rows.map(r => r.facility_id))];
    const carrierIds = rows.map(r => r.carrier_id).filter(Boolean) as bigint[];
    const dockIds = rows.map(r => r.assigned_dock_id).filter(Boolean) as bigint[];
    const [facilities, carriers, docks] = await Promise.all([
      this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } } }),
      carrierIds.length ? this.prisma.carriers.findMany({ where: { tenant_id: tenantId, carrier_id: { in: carrierIds } } }) : [],
      dockIds.length ? this.prisma.loading_docks.findMany({ where: { tenant_id: tenantId, dock_id: { in: dockIds } } }) : [],
    ]);
    const facilityMap = new Map<bigint, string>(facilities.map(f => [f.facility_id, f.facility_name] as [bigint, string]));
    const carrierMap = new Map<bigint, string>(carriers.map(c => [c.carrier_id, c.carrier_name] as [bigint, string]));
    const dockMap = new Map<bigint, string>(docks.map(d => [d.dock_id, d.dock_name] as [bigint, string]));
    const enriched = await this.enrichTrailerRows(rows);
    const data = enriched.map(r => ({
      ...r,
      facility_name: facilityMap.get(r.facility_id),
      carrier_name: r.carrier_id ? carrierMap.get(r.carrier_id) : undefined,
      dock_name: r.assigned_dock_id ? dockMap.get(r.assigned_dock_id) : undefined,
    }));
    return { data, total, page, limit };
  }

  async findById(tenantId: string, trailerId: bigint) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    if (!trailer) throw new NotFoundException('Trailer not found');
    let carrierName: string | undefined;
    let dockName: string | undefined;
    let facilityName: string | undefined;
    if (trailer.carrier_id) {
      const carrier = await this.prisma.carriers.findFirst({ where: { tenant_id: tenantId, carrier_id: trailer.carrier_id } });
      carrierName = carrier?.carrier_name;
    }
    if (trailer.assigned_dock_id) {
      const dock = await this.prisma.loading_docks.findFirst({ where: { tenant_id: tenantId, dock_id: trailer.assigned_dock_id } });
      dockName = dock?.dock_name;
    }
    const facility = await this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: tenantId, facility_id: trailer.facility_id } });
    facilityName = facility?.facility_name;
    return this.enrichTrailerRow({ ...trailer, facility_name: facilityName, carrier_name: carrierName, dock_name: dockName });
  }

  async findByNumber(tenantId: string, facilityId: bigint, trailerNumber: string) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: trailerNumber },
    });
    return trailer;
  }

  async update(tenantId: string, trailerId: bigint, dto: any) {
    await this.findById(tenantId, trailerId);
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: {
        trailer_number: dto.trailer_number,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : undefined,
        trailer_type: dto.trailer_type,
        status: dto.status,
        is_active: dto.is_active,
        seal_number: dto.seal_number,
        max_weight_kg: dto.max_weight_kg,
        max_volume_cbm: dto.max_volume_cbm,
        max_pallets: dto.max_pallets,
        max_cartons: dto.max_cartons,
        arrival_time: dto.arrival_time ? new Date(dto.arrival_time) : undefined,
        departure_time: dto.departure_time ? new Date(dto.departure_time) : undefined,
        notes: dto.notes,
        assigned_load_id: dto.assigned_load_id ? BigInt(dto.assigned_load_id) : undefined,
        assigned_dock_id: dto.assigned_dock_id ? BigInt(dto.assigned_dock_id) : undefined,
      },
    });
    return this.findById(tenantId, trailerId);
  }

  async assignToLoad(tenantId: string, trailerId: bigint, loadId: bigint) {
    const trailer = await this.findById(tenantId, trailerId);
    if (!trailer.is_active) throw new BadRequestException('Trailer is not active');
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: { assigned_load_id: loadId, status: 'LOADING' },
    });
    return { trailerId, loadId, status: 'LOADING' };
  }

  async assignToDock(tenantId: string, trailerId: bigint, dockId: bigint) {
    const trailer = await this.findById(tenantId, trailerId);
    if (!trailer.is_active) throw new BadRequestException('Trailer is not active');
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: { assigned_dock_id: dockId, status: 'AT_DOCK' },
    });
    return { trailerId, dockId, status: 'AT_DOCK' };
  }

  async depart(tenantId: string, trailerId: bigint) {
    await this.findById(tenantId, trailerId);
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: { status: 'DEPARTED', departure_time: new Date() },
    });
    return { trailerId, status: 'DEPARTED', departureTime: new Date() };
  }

  async delete(tenantId: string, trailerId: bigint) {
    const trailer = await this.findById(tenantId, trailerId);
    await this.prisma.trailers.deleteMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    return trailer;
  }

  async getNextLoadingWork(tenantId: string, facilityId: bigint, userId: string) {
    const loads = await this.prisma.loads.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, status: { in: ['PLANNED', 'READY'] } },
      orderBy: { planned_departure_date: 'asc' },
      take: 1,
    });
    if (!loads.length) return null;
    const load = loads[0];
    const docks = await this.prisma.loading_docks.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true, is_available: true },
      take: 1,
    });
    const dock = docks.length ? docks[0] : null;
    const trailers = await this.prisma.trailers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, is_active: true, status: { in: ['ARRIVED', 'AT_DOCK'] } },
      take: 1,
    });
    const trailer = trailers.length ? trailers[0] : null;
    const shipmentCount = await this.prisma.outbound_shipments.count({
      where: { tenant_id: tenantId, load_id: load.load_id },
    });
    return { load, dock, trailer, shipmentCount };
  }
}
