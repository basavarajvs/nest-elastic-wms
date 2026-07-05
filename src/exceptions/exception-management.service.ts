import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exception_severity } from '@prisma/client';

const SEVERITY_ORDER: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

@Injectable()
export class ExceptionManagementService {
  private readonly logger = new Logger(ExceptionManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateExceptionNumber(tenantId: string, facilityId: bigint): Promise<string> {
    const facility = await this.prisma.warehouse_facilities.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId },
      select: { facility_code: true },
    });
    const prefix = facility?.facility_code || 'XX';

    const lastException = await this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId },
      orderBy: { exception_id: 'desc' },
      select: { exception_number: true },
    });

    let seq = 1;
    if (lastException) {
      const parts = lastException.exception_number.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) seq = lastNum + 1;
    }

    return `EXC-${prefix}-${String(seq).padStart(5, '0')}`;
  }

  async create(tenantId: string, dto: any) {
    const exceptionNumber = await this.generateExceptionNumber(tenantId, BigInt(dto.facilityId));
    return this.prisma.exception_management.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        exception_number: exceptionNumber,
        exception_name: dto.exceptionName,
        description: dto.description,
        exception_type: dto.exceptionType,
        exception_severity: dto.exceptionSeverity || 'MEDIUM',
        reference_type: dto.referenceType,
        reference_id: dto.referenceId ? BigInt(dto.referenceId) : undefined,
        location_id: dto.locationId ? BigInt(dto.locationId) : undefined,
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        lot_id: dto.lotId ? BigInt(dto.lotId) : undefined,
        reported_by_user_id: dto.reportedByUserId,
        assigned_to_user_id: dto.assignedToUserId,
        impact_level: dto.impactLevel,
        financial_impact_amount: dto.financialImpactAmount,
        financial_impact_currency: dto.financialImpactCurrency || 'USD',
        notes: dto.notes,
        created_by: dto.createdBy,
      },
    });
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, facility_id: BigInt(query.facilityId) };
    if (query.status) where.status = query.status;
    if (query.exceptionType) where.exception_type = query.exceptionType;
    if (query.exceptionSeverity) where.exception_severity = query.exceptionSeverity;
    if (query.search) {
      where.OR = [
        { exception_number: { contains: query.search, mode: 'insensitive' } },
        { exception_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.exception_management.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reported_at: 'desc' },
      }),
      this.prisma.exception_management.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(tenantId: string, exceptionId: bigint) {
    return this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, exception_id: exceptionId },
    });
  }

  async update(tenantId: string, exceptionId: bigint, dto: any) {
    const data: any = {};
    if (dto.exceptionName !== undefined) data.exception_name = dto.exceptionName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.exceptionSeverity !== undefined) {
      this.validateSeverityTransition(tenantId, exceptionId, dto.exceptionSeverity);
      data.exception_severity = dto.exceptionSeverity;
    }
    if (dto.assignedToUserId !== undefined) data.assigned_to_user_id = dto.assignedToUserId;
    if (dto.impactLevel !== undefined) data.impact_level = dto.impactLevel;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.updatedBy !== undefined) data.updated_by = dto.updatedBy;
    return this.prisma.exception_management.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data,
    });
  }

  async acknowledge(tenantId: string, exceptionId: bigint, userId?: string) {
    const exc = await this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, exception_id: exceptionId },
    });
    if (!exc) throw new NotFoundException('Exception not found');
    if (exc.status !== 'OPEN') throw new BadRequestException('Only OPEN exceptions can be acknowledged');

    return this.prisma.exception_management.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledged_at: new Date(),
        assigned_to_user_id: userId,
        updated_by: userId,
      },
    });
  }

  async resolve(tenantId: string, exceptionId: bigint, dto: any, userId?: string) {
    const exc = await this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, exception_id: exceptionId },
    });
    if (!exc) throw new NotFoundException('Exception not found');
    if (exc.status === 'RESOLVED') throw new BadRequestException('Exception is already resolved');

    return this.prisma.exception_management.updateMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      data: {
        status: 'RESOLVED',
        resolved_at: new Date(),
        resolution_description: dto.resolutionDescription,
        root_cause_description: dto.rootCauseDescription,
        updated_by: userId,
      },
    });
  }

  async validateSeverityTransition(tenantId: string, exceptionId: bigint, newSeverity: string) {
    const exc = await this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, exception_id: exceptionId },
    });
    if (!exc) throw new NotFoundException('Exception not found');

    const currentOrder = SEVERITY_ORDER[exc.exception_severity] ?? -1;
    const newOrder = SEVERITY_ORDER[newSeverity] ?? -1;
    if (newOrder < currentOrder) {
      throw new BadRequestException('Cannot downgrade exception severity');
    }
  }

  async delete(tenantId: string, exceptionId: bigint) {
    return this.prisma.exception_management.deleteMany({
      where: { tenant_id: tenantId, exception_id: exceptionId },
    });
  }
}
