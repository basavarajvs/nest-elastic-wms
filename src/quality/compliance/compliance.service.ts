import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(tenantId: string, dto: any) {
    return this.prisma.compliance_requirements.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facility_id ? BigInt(dto.facility_id) : undefined,
        requirement_code: dto.requirement_code,
        requirement_name: dto.requirement_name,
        description: dto.description,
        category: dto.category,
        sub_category: dto.sub_category,
        regulatory_body: dto.regulatory_body,
        regulation_reference: dto.regulation_reference,
        compliance_frequency: dto.compliance_frequency,
        due_day_of_period: dto.due_day_of_period,
        next_due_date: dto.next_due_date ? new Date(dto.next_due_date) : undefined,
        last_completed_date: dto.last_completed_date ? new Date(dto.last_completed_date) : undefined,
        status: dto.status || 'ACTIVE',
        priority: dto.priority || 'NORMAL',
        responsible_role: dto.responsible_role,
        assigned_to: dto.assigned_to,
        documentation_required: dto.documentation_required,
        documentation_template_url: dto.documentation_template_url,
        created_by: dto.created_by,
      },
    });
  }

  async findAllRequirements(tenantId: string, query: any) {
    const { facilityId, category, status, assignedTo, page: queryPage, limit: queryLimit } = query;
    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (category) where.category = category;
    if (status) where.status = status;
    if (assignedTo) where.assigned_to = assignedTo;
    const [data, total] = await Promise.all([
      this.prisma.compliance_requirements.findMany({
        where,
        skip,
        take: limit,
        orderBy: { next_due_date: 'asc' },
      }),
      this.prisma.compliance_requirements.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findRequirementById(tenantId: string, id: string) {
    const req = await this.prisma.compliance_requirements.findUnique({
      where: { requirement_id: BigInt(id) },
    });
    if (!req) throw new NotFoundException('Compliance requirement not found');
    return req;
  }

  async deleteRequirement(tenantId: string, id: string) {
    const entity = await this.findRequirementById(tenantId, id);
    await this.prisma.compliance_requirements.deleteMany({
      where: { tenant_id: tenantId, requirement_id: BigInt(id) },
    });
    return entity;
  }

  async updateRequirement(tenantId: string, id: string, dto: any) {
    await this.findRequirementById(tenantId, id);
    return this.prisma.compliance_requirements.update({
      where: { requirement_id: BigInt(id) },
      data: {
        requirement_name: dto.requirement_name,
        description: dto.description,
        category: dto.category,
        sub_category: dto.sub_category,
        regulatory_body: dto.regulatory_body,
        regulation_reference: dto.regulation_reference,
        compliance_frequency: dto.compliance_frequency,
        due_day_of_period: dto.due_day_of_period,
        next_due_date: dto.next_due_date ? new Date(dto.next_due_date) : undefined,
        last_completed_date: dto.last_completed_date ? new Date(dto.last_completed_date) : undefined,
        status: dto.status,
        priority: dto.priority,
        responsible_role: dto.responsible_role,
        assigned_to: dto.assigned_to,
        updated_by: dto.updated_by,
      },
    });
  }

  async createAudit(tenantId: string, dto: any) {
    return this.prisma.compliance_audits.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        audit_number: dto.audit_number,
        requirement_id: dto.requirement_id ? BigInt(dto.requirement_id) : undefined,
        audit_type: dto.audit_type,
        audit_date: new Date(dto.audit_date),
        auditor_name: dto.auditor_name,
        auditor_organization: dto.auditor_organization,
        status: dto.status || 'PENDING',
        score: dto.score ? dto.score : undefined,
        findings: dto.findings,
        recommendations: dto.recommendations,
        corrective_actions: dto.corrective_actions,
        follow_up_required: dto.follow_up_required,
        follow_up_due_date: dto.follow_up_due_date ? new Date(dto.follow_up_due_date) : undefined,
        report_url: dto.report_url,
        evidence_urls: dto.evidence_urls,
        created_by: dto.created_by,
      },
    });
  }

  async findAllAudits(tenantId: string, query: any) {
    const { facilityId, requirementId, status, auditType, page: queryPage, limit: queryLimit } = query;
    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (requirementId) where.requirement_id = BigInt(requirementId);
    if (status) where.status = status;
    if (auditType) where.audit_type = auditType;
    const [data, total] = await Promise.all([
      this.prisma.compliance_audits.findMany({
        where,
        skip,
        take: limit,
        orderBy: { audit_date: 'desc' },
      }),
      this.prisma.compliance_audits.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findAuditById(tenantId: string, id: string) {
    const audit = await this.prisma.compliance_audits.findUnique({
      where: { audit_id: BigInt(id) },
    });
    if (!audit) throw new NotFoundException('Compliance audit not found');
    return audit;
  }

  async deleteAudit(tenantId: string, id: string) {
    const entity = await this.findAuditById(tenantId, id);
    await this.prisma.compliance_audits.deleteMany({
      where: { tenant_id: tenantId, audit_id: BigInt(id) },
    });
    return entity;
  }

  async updateAudit(tenantId: string, id: string, dto: any) {
    await this.findAuditById(tenantId, id);
    return this.prisma.compliance_audits.update({
      where: { audit_id: BigInt(id) },
      data: {
        audit_type: dto.audit_type,
        audit_date: dto.audit_date ? new Date(dto.audit_date) : undefined,
        auditor_name: dto.auditor_name,
        auditor_organization: dto.auditor_organization,
        status: dto.status,
        score: dto.score ? dto.score : undefined,
        findings: dto.findings,
        recommendations: dto.recommendations,
        corrective_actions: dto.corrective_actions,
        follow_up_required: dto.follow_up_required,
        follow_up_due_date: dto.follow_up_due_date ? new Date(dto.follow_up_due_date) : undefined,
        report_url: dto.report_url,
        evidence_urls: dto.evidence_urls,
        updated_by: dto.updated_by,
      },
    });
  }

  async createHazmat(tenantId: string, dto: any) {
    return this.prisma.hazmat_materials.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        material_code: dto.material_code,
        material_name: dto.material_name,
        un_number: dto.un_number,
        hazard_class: dto.hazard_class,
        packing_group: dto.packing_group,
        product_id: dto.product_id ? BigInt(dto.product_id) : undefined,
        required_storage_conditions: dto.required_storage_conditions,
        max_storage_quantity: dto.max_storage_quantity ? dto.max_storage_quantity : undefined,
        storage_temperature_min: dto.storage_temperature_min ? dto.storage_temperature_min : undefined,
        storage_temperature_max: dto.storage_temperature_max ? dto.storage_temperature_max : undefined,
        requires_ventilation: dto.requires_ventilation,
        requires_grounding: dto.requires_grounding,
        incompatible_materials: dto.incompatible_materials,
        handling_instructions: dto.handling_instructions,
        ppe_requirements: dto.ppe_requirements,
        emergency_procedures: dto.emergency_procedures,
        spill_response: dto.spill_response,
        sds_document_url: dto.sds_document_url,
        sds_last_updated: dto.sds_last_updated ? new Date(dto.sds_last_updated) : undefined,
        dot_regulated: dto.dot_regulated,
        epa_regulated: dto.epa_regulated,
        osha_regulated: dto.osha_regulated,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: dto.created_by,
      },
    });
  }

  async findAllHazmat(tenantId: string, query: any) {
    const { facilityId, hazardClass, isActive, productId, page: queryPage, limit: queryLimit } = query;
    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (facilityId) where.facility_id = BigInt(facilityId);
    if (hazardClass) where.hazard_class = hazardClass;
    if (isActive !== undefined) where.is_active = isActive === 'true' || isActive === true;
    if (productId) where.product_id = BigInt(productId);
    const [data, total] = await Promise.all([
      this.prisma.hazmat_materials.findMany({
        where,
        skip,
        take: limit,
        orderBy: { material_name: 'asc' },
      }),
      this.prisma.hazmat_materials.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findHazmatById(tenantId: string, id: string) {
    const hazmat = await this.prisma.hazmat_materials.findUnique({
      where: { hazmat_id: BigInt(id) },
    });
    if (!hazmat) throw new NotFoundException('Hazmat material not found');
    return hazmat;
  }

  async deleteHazmat(tenantId: string, id: string) {
    const entity = await this.findHazmatById(tenantId, id);
    await this.prisma.hazmat_materials.deleteMany({
      where: { tenant_id: tenantId, hazmat_id: BigInt(id) },
    });
    return entity;
  }

  async updateHazmat(tenantId: string, id: string, dto: any) {
    await this.findHazmatById(tenantId, id);
    return this.prisma.hazmat_materials.update({
      where: { hazmat_id: BigInt(id) },
      data: {
        material_name: dto.material_name,
        un_number: dto.un_number,
        hazard_class: dto.hazard_class,
        packing_group: dto.packing_group,
        required_storage_conditions: dto.required_storage_conditions,
        max_storage_quantity: dto.max_storage_quantity ? dto.max_storage_quantity : undefined,
        storage_temperature_min: dto.storage_temperature_min ? dto.storage_temperature_min : undefined,
        storage_temperature_max: dto.storage_temperature_max ? dto.storage_temperature_max : undefined,
        requires_ventilation: dto.requires_ventilation,
        requires_grounding: dto.requires_grounding,
        incompatible_materials: dto.incompatible_materials,
        handling_instructions: dto.handling_instructions,
        ppe_requirements: dto.ppe_requirements,
        emergency_procedures: dto.emergency_procedures,
        spill_response: dto.spill_response,
        sds_document_url: dto.sds_document_url,
        sds_last_updated: dto.sds_last_updated ? new Date(dto.sds_last_updated) : undefined,
        dot_regulated: dto.dot_regulated,
        epa_regulated: dto.epa_regulated,
        osha_regulated: dto.osha_regulated,
        is_active: dto.is_active,
        updated_by: dto.updated_by,
      },
    });
  }
}
