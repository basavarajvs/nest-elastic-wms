import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NcrService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const ncr = await this.prisma.non_conformance_reports.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        ncr_number: dto.ncr_number,
        ncr_name: dto.ncr_name,
        description: dto.description,
        reference_type: dto.reference_type,
        reference_id: dto.reference_id ? BigInt(dto.reference_id) : undefined,
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        lot_id: dto.lot_id ? BigInt(dto.lot_id) : undefined,
        severity: dto.severity || 'MEDIUM',
        status: 'OPEN',
        reported_by_user_id: dto.reported_by_user_id,
        assigned_to_user_id: dto.assigned_to_user_id,
        notes: dto.notes,
        corrective_action_required: dto.corrective_action_required,
        created_by: dto.created_by,
      },
    });
    let product_name: string | undefined;
    if (ncr.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: ncr.product_id } });
      product_name = product?.product_name;
    }
    return { ...ncr, product_name };
  }

  async findAll(tenantId: string, query: any) {
    const { facilityId, status, severity, productId, assignedToUserId, page: queryPage, limit: queryLimit } = query;
    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 50;
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
    const productIds = [...new Set(data.filter(d => d.product_id).map(d => d.product_id))] as bigint[];
    const products = productIds.length
      ? await this.prisma.products.findMany({ where: { tenant_id: tenantId, product_id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map(p => [p.product_id, p.product_name]));
    const mapped = data.map(d => ({
      ...d,
      product_name: d.product_id ? productMap.get(d.product_id) : undefined,
    }));
    return { data: mapped, total, page, limit };
  }

  async findById(tenantId: string, id: string) {
    const ncr = await this.prisma.non_conformance_reports.findUnique({
      where: { ncr_id: BigInt(id) },
    });
    if (!ncr) throw new NotFoundException('NCR not found');
    let product_name: string | undefined;
    if (ncr.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: ncr.product_id } });
      product_name = product?.product_name;
    }
    return { ...ncr, product_name };
  }

  async delete(tenantId: string, id: string) {
    const entity = await this.findById(tenantId, id);
    await this.prisma.non_conformance_reports.deleteMany({
      where: { tenant_id: tenantId, ncr_id: BigInt(id) },
    });
    return entity;
  }

  async update(tenantId: string, id: string, dto: any) {
    const ncr = await this.findById(tenantId, id);
    const updateData: any = {};
    if (dto.assigned_to_user_id !== undefined) updateData.assigned_to_user_id = dto.assigned_to_user_id;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.root_cause_description !== undefined) updateData.root_cause_description = dto.root_cause_description;
    if (dto.resolution_description !== undefined) updateData.resolution_description = dto.resolution_description;
    if (dto.corrective_action_taken !== undefined) updateData.corrective_action_taken = dto.corrective_action_taken;
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
    updateData.updated_by = dto.updated_by;
    const updated = await this.prisma.non_conformance_reports.update({
      where: { ncr_id: BigInt(id) },
      data: updateData,
    });
    let product_name: string | undefined;
    if (updated.product_id) {
      const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: updated.product_id } });
      product_name = product?.product_name;
    }
    return { ...updated, product_name };
  }
}
