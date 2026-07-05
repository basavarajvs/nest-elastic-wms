import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InboundTrailerService {
  private readonly logger = new Logger(InboundTrailerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkIn(tenantId: string, facilityId: bigint, dto: any) {
    const existing = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: dto.trailerNumber, status: { notIn: ['DEPARTED', 'CLOSED'] } },
    });
    if (existing) throw new BadRequestException(`Trailer ${dto.trailerNumber} is already checked in (status: ${existing.status})`);
    return this.prisma.trailers.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        trailer_number: dto.trailerNumber,
        carrier_id: dto.carrierId ? BigInt(dto.carrierId) : undefined,
        trailer_type: dto.trailerType || 'DRY_VAN',
        status: 'ARRIVED',
        is_active: true,
        arrival_time: dto.arrivalTime ? new Date(dto.arrivalTime) : new Date(),
        notes: dto.notes,
      },
    });
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
    return { trailerId, dockId: dock.dock_id, status: 'AT_DOCK' };
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
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
    return this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: trailerNumber },
    });
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
    return { trailerId, status: 'DEPARTED' };
  }

  async delete(tenantId: string, trailerId: bigint) {
    return this.prisma.trailers.deleteMany({
      where: { tenant_id: tenantId, trailer_id: trailerId },
    });
  }
}
