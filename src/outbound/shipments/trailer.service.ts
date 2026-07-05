import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrailerService {
  private readonly logger = new Logger(TrailerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.trailers.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        trailer_number: dto.trailerNumber,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
        trailer_type: dto.trailerType || 'DRY_VAN',
        status: dto.status || 'ARRIVED',
        is_active: dto.isActive ?? true,
        max_weight_kg: dto.maxWeightKg,
        max_volume_cbm: dto.maxVolumeCbm,
        max_pallets: dto.maxPallets,
        max_cartons: dto.maxCartons,
        seal_number: dto.sealNumber,
        arrival_time: dto.arrivalTime ? new Date(dto.arrivalTime) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
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
    const [data, total] = await Promise.all([
      this.prisma.trailers.findMany({ where, skip, take: limit, orderBy: { arrival_time: 'desc' } }),
      this.prisma.trailers.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, trailerId: bigint) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
    if (!trailer) throw new NotFoundException('Trailer not found');
    return trailer;
  }

  async findByNumber(tenantId: string, facilityId: bigint, trailerNumber: string) {
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: trailerNumber },
    });
    return trailer;
  }

  async update(tenantId: string, trailerId: bigint, dto: any) {
    const trailer = await this.findById(tenantId, trailerId);
    return this.prisma.trailers.updateMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
      data: {
        trailer_number: dto.trailerNumber,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
        status: dto.status,
        seal_number: dto.sealNumber,
        departure_time: dto.departureTime ? new Date(dto.departureTime) : undefined,
        notes: dto.notes,
        assigned_load_id: dto.assignedLoadId ? BigInt(dto.assignedLoadId) : undefined,
        assigned_dock_id: dto.assignedDockId ? BigInt(dto.assignedDockId) : undefined,
      },
    });
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
    return this.prisma.trailers.deleteMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
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
