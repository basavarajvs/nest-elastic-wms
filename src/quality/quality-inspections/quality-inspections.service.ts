import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInspectionDto, UpdateInspectionDto, CreateInspectionResultDto } from './dtos/inspection.dto';

@Injectable()
export class QualityInspectionsService {
  private readonly logger = new Logger(QualityInspectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateInspectionDto, tenantId: string, userId?: string): Promise<any> {
    const count = await this.prisma.qualityInspection.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const inspectionNumber = `INSP-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const inspection = await this.prisma.qualityInspection.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        inspectionNumber,
        inspectionType: dto.inspectionType,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        lotId: dto.lotId,
        locationId: dto.locationId,
        assignedToUserId: dto.assignedToUserId,
        status: 'PENDING',
        priority: dto.priority ?? 'MEDIUM',
        notes: dto.notes,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      },
    });

    await this.prisma.qualityInspectionEvent.create({
      data: {
        tenantId,
        inspectionId: inspection.id,
        eventType: 'ASSIGNED',
        eventData: { createdBy: userId, inspectionType: dto.inspectionType, referenceType: dto.referenceType, referenceId: dto.referenceId, notes: dto.notes },
        performedBy: userId,
      },
    });

    this.eventEmitter.emit('quality.inspection.created', { inspectionId: inspection.id, inspectionNumber, tenantId });
    return inspection;
  }

  async findAll(tenantId: string, filters?: { status?: string; inspectionType?: string; facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.inspectionType) where.inspectionType = filters.inspectionType;
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    return this.prisma.qualityInspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id, tenantId },
      include: {
        results: { orderBy: { checkedAt: 'desc' } },
        events: { orderBy: { performedAt: 'desc' } },
      },
    });
    if (!inspection) throw new NotFoundException('Quality inspection not found');
    return inspection;
  }

  async update(id: string, dto: UpdateInspectionDto, tenantId: string, userId?: string): Promise<any> {
    const inspection = await this.findById(id, tenantId);
    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'IN_PROGRESS') {
        await this.prisma.qualityInspectionEvent.create({
          data: {
            tenantId,
            inspectionId: id,
            eventType: 'STARTED',
            performedBy: userId,
          },
        });
      }
      if (['PASSED', 'FAILED', 'CONDITIONAL'].includes(dto.status)) {
        updateData.completedAt = new Date();
        await this.prisma.qualityInspectionEvent.create({
          data: {
            tenantId,
            inspectionId: id,
            eventType: dto.status === 'PASSED' ? 'COMPLETED' : 'FAILED',
            eventData: { previousStatus: inspection.status, userId },
            performedBy: userId,
          },
        });
      }
    }
    if (dto.assignedToUserId !== undefined) {
      updateData.assignedToUserId = dto.assignedToUserId;
      await this.prisma.qualityInspectionEvent.create({
        data: {
          tenantId,
          inspectionId: id,
          eventType: 'ASSIGNED',
          eventData: { assignedTo: dto.assignedToUserId, previous: inspection.assignedToUserId },
          performedBy: userId,
        },
      });
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.priority !== undefined) updateData.priority = dto.priority;

    const updated = await this.prisma.qualityInspection.update({
      where: { id },
      data: updateData,
    });

    if (dto.status && dto.status !== inspection.status) {
      this.eventEmitter.emit('quality.inspection.status_changed', { inspectionId: id, status: dto.status, tenantId });
    }
    return updated;
  }

  async submitResult(inspectionId: string, dto: CreateInspectionResultDto, tenantId: string, userId?: string): Promise<any> {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id: inspectionId, tenantId },
    });
    if (!inspection) throw new NotFoundException('Quality inspection not found');
    if (inspection.status === 'PASSED' || inspection.status === 'FAILED') {
      throw new BadRequestException('Cannot add results to a completed inspection');
    }

    const result = await this.prisma.qualityInspectionResult.create({
      data: {
        tenantId,
        inspectionId,
        checkType: dto.checkType,
        result: dto.result,
        measuredValue: dto.measuredValue ?? undefined,
        toleranceMin: dto.toleranceMin ?? undefined,
        toleranceMax: dto.toleranceMax ?? undefined,
        notes: dto.notes,
        mediaUrl: dto.mediaUrl,
        checkedByUserId: userId,
      },
    });

    await this.prisma.qualityInspectionEvent.create({
      data: {
        tenantId,
        inspectionId,
        eventType: 'RESULT_SUBMITTED',
        eventData: { resultId: result.id, checkType: dto.checkType, result: dto.result },
        performedBy: userId,
      },
    });

    if (inspection.status === 'PENDING') {
      await this.prisma.qualityInspection.update({
        where: { id: inspectionId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return result;
  }

  async getEvents(inspectionId: string, tenantId: string): Promise<any> {
    const inspection = await this.prisma.qualityInspection.findFirst({
      where: { id: inspectionId, tenantId },
    });
    if (!inspection) throw new NotFoundException('Quality inspection not found');
    return this.prisma.qualityInspectionEvent.findMany({
      where: { tenantId, inspectionId },
      orderBy: { performedAt: 'desc' },
    });
  }

  async findMyTasks(tenantId: string, assignedToUserId: string): Promise<any> {
    return this.prisma.qualityInspection.findMany({
      where: { tenantId, assignedToUserId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async recordRfResult(inspectionId: string, dto: CreateInspectionResultDto, tenantId: string, userId?: string): Promise<any> {
    return this.submitResult(inspectionId, dto, tenantId, userId);
  }
}
