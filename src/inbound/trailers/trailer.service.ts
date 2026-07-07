import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InboundTrailerService {
  private readonly logger = new Logger(InboundTrailerService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async enrich(trailer: any) {
    const [facility, carrier, load, dock] = await Promise.all([
      trailer.facility_id
        ? this.prisma.warehouse_facilities.findFirst({ where: { tenant_id: trailer.tenant_id, facility_id: trailer.facility_id } })
        : null,
      trailer.carrier_id
        ? this.prisma.carriers.findFirst({ where: { carrier_id: trailer.carrier_id } })
        : null,
      trailer.assigned_load_id
        ? this.prisma.loads.findFirst({ where: { load_id: trailer.assigned_load_id } })
        : null,
      trailer.assigned_dock_id
        ? this.prisma.loading_docks.findFirst({ where: { dock_id: trailer.assigned_dock_id } })
        : null,
    ]);
    return {
      ...trailer,
      facility_name: facility?.facility_name ?? null,
      carrier_name: carrier?.carrier_name ?? null,
      load_number: load?.load_number ?? null,
      dock_name: dock?.dock_name ?? null,
    };
  }

  async checkIn(tenantId: string, facilityId: bigint, dto: any) {
    const existing = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: dto.trailer_number, status: { notIn: ['DEPARTED', 'CLOSED'] } },
    });
    if (existing) throw new BadRequestException(`Trailer ${dto.trailer_number} is already checked in (status: ${existing.status})`);
    const created = await this.prisma.trailers.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        trailer_number: dto.trailer_number,
        carrier_id: dto.carrier_id ? BigInt(dto.carrier_id) : undefined,
        seal_number: dto.seal_number,
        assigned_dock_id: dto.dock_id ? BigInt(dto.dock_id) : undefined,
        trailer_type: dto.trailer_type || 'DRY_VAN',
        max_weight_kg: dto.max_weight_kg,
        max_volume_cbm: dto.max_volume_cbm,
        max_pallets: dto.max_pallets,
        max_cartons: dto.max_cartons,
        status: 'ARRIVED',
        is_active: true,
        arrival_time: dto.arrival_time ? new Date(dto.arrival_time) : new Date(),
        notes: dto.notes,
      },
    });
    return this.enrich(created);
  }

  async assignDock(tenantId: string, facilityId: bigint, trailerId: bigint, dockCode: string) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    if (!trailer) throw new NotFoundException('Trailer not found');
    if (trailer.status !== 'ARRIVED') throw new BadRequestException(`Trailer must be ARRIVED, current: ${trailer.status}`);
    const dock = await this.prisma.loading_docks.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode },
    });
    if (!dock) throw new NotFoundException('Dock door not found');
    if (!dock.is_active) throw new BadRequestException('Dock door is not active');
    if (!dock.is_available) throw new BadRequestException('Dock door is not available');
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: { assigned_dock_id: dock.dock_id, status: 'AT_DOCK' },
    });
    await this.prisma.loading_docks.updateMany({
      where: { tenant_id: tenantId, dock_id: dock.dock_id },
      data: { is_available: false },
    });
    return this.findById(tenantId, trailerId);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.trailers.findMany({ where, skip, take: limit, orderBy: { arrival_time: 'desc' } }),
      this.prisma.trailers.count({ where }),
    ]);
    return { data: await Promise.all(data.map(t => this.enrich(t))), total, page, limit };
  }

  async findById(tenantId: string, trailerId: bigint) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    if (!trailer) throw new NotFoundException('Trailer not found');
    return this.enrich(trailer);
  }

  async findByNumber(tenantId: string, facilityId: bigint, trailerNumber: string) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: trailerNumber },
    });
    return trailer ? this.enrich(trailer) : null;
  }

  async depart(tenantId: string, trailerId: bigint) {
    const trailer = await this.findById(tenantId, trailerId);
    if (trailer.status === 'DEPARTED') throw new BadRequestException('Trailer already departed');
    if (trailer.assigned_dock_id) {
      await this.prisma.loading_docks.updateMany({
        where: { tenant_id: tenantId, dock_id: trailer.assigned_dock_id },
        data: { is_available: true },
      });
    }
    await this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: { status: 'DEPARTED', departure_time: new Date(), assigned_dock_id: null, assigned_load_id: null },
    });
    return this.findById(tenantId, trailerId);
  }

  async delete(tenantId: string, trailerId: bigint) {
    const result = await this.prisma.trailers.deleteMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    return { count: result.count };
  }
}
