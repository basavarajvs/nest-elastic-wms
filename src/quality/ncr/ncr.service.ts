import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NcrService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    return this.prisma.non_conformance_reports.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        ncr_number: dto.ncrNumber,
        ncr_name: dto.ncrName,
        description: dto.description,
        reference_type: dto.referenceType,
        reference_id: dto.referenceId ? BigInt(dto.referenceId) : undefined,
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        lot_id: dto.lotId ? BigInt(dto.lotId) : undefined,
        severity: dto.severity || 'MEDIUM',
        status: 'OPEN',
        reported_by_user_id: dto.reportedByUserId,
        assigned_to_user_id: dto.assignedToUserId,
        notes: dto.notes,
        corrective_action_required: dto.correctiveActionRequired,
        created_by: dto.createdBy,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, severity, productId, assignedToUserId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (productId) where.product_id = BigInt(productId);
    if (assignedToUserId) where.assigned_to_user_id = assignedToUserId;
    const [data, total] = await Promise.all([
      this.prisma.non_conformance_reports.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reported_at: 'desc' },
      }),
      this.prisma.non_conformance_reports.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const ncr = await this.prisma.non_conformance_reports.findUnique({
      where: { ncr_id: BigInt(id) },
    });
    if (!ncr) throw new NotFoundException('NCR not found');
    return ncr;
  }

  async delete(tenantId: string, id: string) {
    await this.prisma.non_conformance_reports.deleteMany({
      where: { tenant_id: tenantId, ncr_id: BigInt(id) },
    });
    return { message: 'NCR deleted successfully' };
  }

  async update(tenantId: string, id: string, dto: any) {
    const ncr = await this.findById(tenantId, id);
    const updateData: any = {};
    if (dto.assignedToUserId !== undefined) updateData.assigned_to_user_id = dto.assignedToUserId;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.rootCauseDescription !== undefined) updateData.root_cause_description = dto.rootCauseDescription;
    if (dto.resolutionDescription !== undefined) updateData.resolution_description = dto.resolutionDescription;
    if (dto.correctiveActionTaken !== undefined) updateData.corrective_action_taken = dto.correctiveActionTaken;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        OPEN: ['INVESTIGATING', 'CLOSED'],
        INVESTIGATING: ['RESOLVED', 'OPEN'],
        RESOLVED: ['CLOSED', 'INVESTIGATING'],
        CLOSED: ['OPEN'],
      };
      const allowed = validTransitions[ncr.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(`Cannot transition from ${ncr.status} to ${dto.status}`);
      }
      updateData.status = dto.status;
      if (dto.status === 'RESOLVED') updateData.resolved_at = new Date();
      if (dto.status === 'CLOSED') updateData.closed_at = new Date();
    }
    updateData.updated_by = dto.updatedBy;
    return this.prisma.non_conformance_reports.update({
      where: { ncr_id: BigInt(id) },
      data: updateData,
    });
  }
}
