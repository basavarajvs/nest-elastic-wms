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
    const exceptionNumber = await this.generateExceptionNumber(tenantId, BigInt(dto.facility_id));
    const record = await this.prisma.exception_management.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        exception_number: exceptionNumber,
        exception_name: dto.exception_name,
        description: dto.description,
        exception_type: dto.exception_type,
        exception_severity: dto.exception_severity || 'MEDIUM',
        reference_type: dto.reference_type,
        reference_id: dto.reference_id ? BigInt(dto.reference_id) : undefined,
        location_id: dto.location_id ? BigInt(dto.location_id) : undefined,
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        lot_id: dto.lot_id ? BigInt(dto.lot_id) : undefined,
        reported_by_user_id: dto.reported_by_user_id,
        assigned_to_user_id: dto.assigned_to_user_id,
        impact_level: dto.impact_level,
        financial_impact_amount: dto.financial_impact_amount,
        financial_impact_currency: dto.financial_impact_currency || 'USD',
        notes: dto.notes,
        created_by: dto.created_by,
      },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    return this.flattenException(tenantId, record);
  }

  async findAll(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId, ...(query.facilityId ? { facility_id: BigInt(query.facilityId) } : {})  };
    if (query.status) where.status = query.status;
    if (query.exceptionType) where.exception_type = query.exceptionType;
    if (query.exceptionSeverity) where.exception_severity = query.exceptionSeverity;
    if (query.search) {
      where.OR = [
        { exception_number: { contains: query.search, mode: 'insensitive' } },
        { exception_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.exception_management.findMany({
        where,
        include: { warehouse_facilities: { select: { facility_name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reported_at: 'desc' },
      }),
      this.prisma.exception_management.count({ where }),
    ]);
    const enriched = await this.flattenExceptions(tenantId, data);
    return { data: enriched, total, page, limit };
  }

  async findById(tenantId: string, exceptionId: bigint) {
    const record = await this.prisma.exception_management.findFirst({
      where: { tenant_id: tenantId, exception_id: exceptionId },
      include: { warehouse_facilities: { select: { facility_name: true } } },
    });
    if (!record) return null;
    return this.flattenException(tenantId, record);
  }

  async update(tenantId: string, exceptionId: bigint, dto: any) {
    const data: any = {};
    if (dto.exception_name !== undefined) data.exception_name = dto.exception_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.exception_severity !== undefined) {
      this.validateSeverityTransition(tenantId, exceptionId, dto.exception_severity);
      data.exception_severity = dto.exception_severity;
    }
    if (dto.assigned_to_user_id !== undefined) data.assigned_to_user_id = dto.assigned_to_user_id;
    if (dto.impact_level !== undefined) data.impact_level = dto.impact_level;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.updated_by !== undefined) data.updated_by = dto.updated_by;
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
        resolution_description: dto.resolution_description,
        root_cause_description: dto.root_cause_description,
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

  private flattenException(tenantId: string, record: any) {
    return this.flattenExceptions(tenantId, [record]).then(r => r[0]);
  }

  private async flattenExceptions(tenantId: string, records: any[]) {
    if (!records.length) return [];

    const locationIds = [...new Set(records.filter(r => r.location_id).map(r => r.location_id))];
    const productIds = [...new Set(records.filter(r => r.product_id).map(r => r.product_id))];
    const lotIds = [...new Set(records.filter(r => r.lot_id).map(r => r.lot_id))];

    const [locations, products, lots] = await Promise.all([
      locationIds.length
        ? this.prisma.storage_locations.findMany({
            where: { tenant_id: tenantId, location_id: { in: locationIds } },
            select: { location_id: true, location_name: true },
          })
        : [],
      productIds.length
        ? this.prisma.products.findMany({
            where: { tenant_id: tenantId, product_id: { in: productIds } },
            select: { product_id: true, product_name: true },
          })
        : [],
      lotIds.length
        ? this.prisma.inventory_lots.findMany({
            where: { tenant_id: tenantId, lot_id: { in: lotIds } },
            select: { lot_id: true, lot_number: true },
          })
        : [],
    ]);

    const locMap = new Map<string, string | null>(
      locations.map(l => [l.location_id.toString(), l.location_name] as [string, string | null]),
    );
    const prodMap = new Map<string, string | null>(
      products.map(p => [p.product_id.toString(), p.product_name] as [string, string | null]),
    );
    const lotMap = new Map<string, string | null>(
      lots.map(l => [l.lot_id.toString(), l.lot_number] as [string, string | null]),
    );

    return records.map(record => {
      const { warehouse_facilities, ...rest } = record;
      return {
        ...rest,
        facility_name: warehouse_facilities?.facility_name || null,
        location_name: record.location_id ? locMap.get(record.location_id.toString()) ?? null : null,
        product_name: record.product_id ? prodMap.get(record.product_id.toString()) ?? null : null,
        lot_number: record.lot_id ? lotMap.get(record.lot_id.toString()) ?? null : null,
      };
    });
  }
}
