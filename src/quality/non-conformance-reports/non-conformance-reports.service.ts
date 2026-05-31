import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateNcrDto, UpdateNcrDto } from './dtos/create-ncr.dto';

@Injectable()
export class NonConformanceReportsService {
  private readonly logger = new Logger(NonConformanceReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateNcrDto, tenantId: string): Promise<any> {
    const count = await (this.prisma as any).nonConformanceReport.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const ncrNumber = `NCR-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const ncr = await (this.prisma as any).nonConformanceReport.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        ncrNumber,
        ncrName: dto.ncrName,
        description: dto.description,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        lotId: dto.lotId,
        severity: dto.severity ?? 'LOW',
        status: 'OPEN',
        assignedToUserId: dto.assignedToUserId,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('ncr.created', { ncrId: ncr.id, ncrNumber, tenantId });
    return ncr;
  }

  async findAll(tenantId: string, filters?: { status?: string; facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    return (this.prisma as any).nonConformanceReport.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const ncr = await (this.prisma as any).nonConformanceReport.findFirst({ where: { id, tenantId } });
    if (!ncr) throw new NotFoundException('Non-conformance report not found');
    return ncr;
  }

  async update(id: string, dto: UpdateNcrDto, tenantId: string): Promise<any> {
    const ncr = await this.findById(id, tenantId);
    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'RESOLVED') updateData.resolvedAt = new Date();
    }
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.rootCause !== undefined) updateData.rootCause = dto.rootCause;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.correctiveAction !== undefined) updateData.correctiveAction = dto.correctiveAction;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await (this.prisma as any).nonConformanceReport.update({
      where: { id },
      data: updateData,
    });

    if (dto.status && dto.status !== ncr.status) {
      this.eventEmitter.emit('ncr.status_changed', { ncrId: id, status: dto.status, tenantId });
    }
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).nonConformanceReport.delete({ where: { id } });
  }
}
