import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExceptionEscalationService } from './exception-escalation.service';
import { CreateExceptionDto, UpdateExceptionDto } from './dtos/create-exception.dto';

@Injectable()
export class ExceptionManagementService {
  private readonly logger = new Logger(ExceptionManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly escalationService: ExceptionEscalationService,
  ) {}

  async create(dto: CreateExceptionDto, tenantId: string, reportedByUserId?: string): Promise<any> {
    const count = await (this.prisma as any).exceptionManagement.count({
      where: { tenantId, facilityId: dto.facilityId },
    });
    const exceptionNumber = `EXC-${dto.facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const exception = await (this.prisma as any).exceptionManagement.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        exceptionNumber,
        exceptionType: dto.exceptionType,
        severity: dto.severity ?? 'LOW',
        status: 'OPEN',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        locationId: dto.locationId,
        productId: dto.productId,
        lotId: dto.lotId,
        reportedByUserId: reportedByUserId ?? null,
        assignedToUserId: dto.assignedToUserId,
        notes: dto.notes,
      },
    });

    this.eventEmitter.emit('exception.created', { exceptionId: exception.id, tenantId });
    this.escalationService.checkEscalation(exception.id, tenantId).catch(err => {
      this.logger.error(`Escalation check failed for ${exception.id}: ${err.message}`);
    });
    return exception;
  }

  async findAll(tenantId: string, filters?: { status?: string; facilityId?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.facilityId) where.facilityId = filters.facilityId;

    return (this.prisma as any).exceptionManagement.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const exception = await (this.prisma as any).exceptionManagement.findFirst({
      where: { id, tenantId },
    });
    if (!exception) throw new NotFoundException('Exception not found');
    return exception;
  }

  async update(id: string, dto: UpdateExceptionDto, tenantId: string): Promise<any> {
    const exception = await this.findById(id, tenantId);

    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'ACKNOWLEDGED') updateData.acknowledgedAt = new Date();
      if (dto.status === 'RESOLVED') updateData.resolvedAt = new Date();
    }
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.resolutionDescription !== undefined) updateData.resolutionDescription = dto.resolutionDescription;
    if (dto.rootCause !== undefined) updateData.rootCause = dto.rootCause;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await (this.prisma as any).exceptionManagement.update({
      where: { id },
      data: updateData,
    });

    if (dto.status && dto.status !== exception.status) {
      this.eventEmitter.emit('exception.status_changed', { exceptionId: id, status: dto.status, tenantId });
      if (dto.status !== 'RESOLVED' && dto.status !== 'CLOSED') {
        this.escalationService.checkEscalation(id, tenantId).catch(err => {
          this.logger.error(`Escalation check failed for ${id}: ${err.message}`);
        });
      }
    }

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await (this.prisma as any).exceptionManagement.delete({ where: { id } });
  }
}
