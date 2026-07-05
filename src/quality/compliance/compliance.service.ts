import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(tenantId: string, dto: any) {
    return this.prisma.compliance_requirements.create({
      data: {
        tenant_id: tenantId,
        facility_id: dto.facilityId ? BigInt(dto.facilityId) : undefined,
        requirement_code: dto.requirementCode,
        requirement_name: dto.requirementName,
        description: dto.description,
        category: dto.category,
        sub_category: dto.subCategory,
        regulatory_body: dto.regulatoryBody,
        regulation_reference: dto.regulationReference,
        compliance_frequency: dto.complianceFrequency,
        due_day_of_period: dto.dueDayOfPeriod,
        next_due_date: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        last_completed_date: dto.lastCompletedDate ? new Date(dto.lastCompletedDate) : undefined,
        status: dto.status || 'ACTIVE',
        priority: dto.priority || 'NORMAL',
        responsible_role: dto.responsibleRole,
        assigned_to: dto.assignedTo,
        documentation_required: dto.documentationRequired,
        documentation_template_url: dto.documentationTemplateUrl,
        created_by: dto.createdBy,
      },
    });
  }

  async findAllRequirements(tenantId: string, query: any) {
    const { facilityId, category, status, assignedTo, page = 1, limit = 50 } = query;
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
    await this.prisma.compliance_requirements.deleteMany({
      where: { tenant_id: tenantId, requirement_id: BigInt(id) },
    });
    return { message: 'Compliance requirement deleted successfully' };
  }

  async updateRequirement(tenantId: string, id: string, dto: any) {
    await this.findRequirementById(tenantId, id);
    return this.prisma.compliance_requirements.update({
      where: { requirement_id: BigInt(id) },
      data: {
        requirement_name: dto.requirementName,
        description: dto.description,
        category: dto.category,
        sub_category: dto.subCategory,
        regulatory_body: dto.regulatoryBody,
        regulation_reference: dto.regulationReference,
        compliance_frequency: dto.complianceFrequency,
        due_day_of_period: dto.dueDayOfPeriod,
        next_due_date: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        last_completed_date: dto.lastCompletedDate ? new Date(dto.lastCompletedDate) : undefined,
        status: dto.status,
        priority: dto.priority,
        responsible_role: dto.responsibleRole,
        assigned_to: dto.assignedTo,
        updated_by: dto.updatedBy,
      },
    });
  }

  async createAudit(tenantId: string, dto: any) {
    return this.prisma.compliance_audits.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        audit_number: dto.auditNumber,
        requirement_id: dto.requirementId ? BigInt(dto.requirementId) : undefined,
        audit_type: dto.auditType,
        audit_date: new Date(dto.auditDate),
        auditor_name: dto.auditorName,
        auditor_organization: dto.auditorOrganization,
        status: dto.status || 'PENDING',
        score: dto.score ? dto.score : undefined,
        findings: dto.findings,
        recommendations: dto.recommendations,
        corrective_actions: dto.correctiveActions,
        follow_up_required: dto.followUpRequired,
        follow_up_due_date: dto.followUpDueDate ? new Date(dto.followUpDueDate) : undefined,
        report_url: dto.reportUrl,
        evidence_urls: dto.evidenceUrls,
        created_by: dto.createdBy,
      },
    });
  }

  async findAllAudits(tenantId: string, query: any) {
    const { facilityId, requirementId, status, auditType, page = 1, limit = 50 } = query;
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
    await this.prisma.compliance_audits.deleteMany({
      where: { tenant_id: tenantId, audit_id: BigInt(id) },
    });
    return { message: 'Compliance audit deleted successfully' };
  }

  async updateAudit(tenantId: string, id: string, dto: any) {
    await this.findAuditById(tenantId, id);
    return this.prisma.compliance_audits.update({
      where: { audit_id: BigInt(id) },
      data: {
        audit_type: dto.auditType,
        audit_date: dto.auditDate ? new Date(dto.auditDate) : undefined,
        auditor_name: dto.auditorName,
        auditor_organization: dto.auditorOrganization,
        status: dto.status,
        score: dto.score ? dto.score : undefined,
        findings: dto.findings,
        recommendations: dto.recommendations,
        corrective_actions: dto.correctiveActions,
        follow_up_required: dto.followUpRequired,
        follow_up_due_date: dto.followUpDueDate ? new Date(dto.followUpDueDate) : undefined,
        report_url: dto.reportUrl,
        evidence_urls: dto.evidenceUrls,
        updated_by: dto.updatedBy,
      },
    });
  }

  async createHazmat(tenantId: string, dto: any) {
    return this.prisma.hazmat_materials.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        material_code: dto.materialCode,
        material_name: dto.materialName,
        un_number: dto.unNumber,
        hazard_class: dto.hazardClass,
        packing_group: dto.packingGroup,
        product_id: dto.productId ? BigInt(dto.productId) : undefined,
        required_storage_conditions: dto.requiredStorageConditions,
        max_storage_quantity: dto.maxStorageQuantity ? dto.maxStorageQuantity : undefined,
        storage_temperature_min: dto.storageTemperatureMin ? dto.storageTemperatureMin : undefined,
        storage_temperature_max: dto.storageTemperatureMax ? dto.storageTemperatureMax : undefined,
        requires_ventilation: dto.requiresVentilation,
        requires_grounding: dto.requiresGrounding,
        incompatible_materials: dto.incompatibleMaterials,
        handling_instructions: dto.handlingInstructions,
        ppe_requirements: dto.ppeRequirements,
        emergency_procedures: dto.emergencyProcedures,
        spill_response: dto.spillResponse,
        sds_document_url: dto.sdsDocumentUrl,
        sds_last_updated: dto.sdsLastUpdated ? new Date(dto.sdsLastUpdated) : undefined,
        dot_regulated: dto.dotRegulated,
        epa_regulated: dto.epaRegulated,
        osha_regulated: dto.oshaRegulated,
        is_active: dto.isActive !== undefined ? dto.isActive : true,
        created_by: dto.createdBy,
      },
    });
  }

  async findAllHazmat(tenantId: string, query: any) {
    const { facilityId, hazardClass, isActive, productId, page = 1, limit = 50 } = query;
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
    await this.prisma.hazmat_materials.deleteMany({
      where: { tenant_id: tenantId, hazmat_id: BigInt(id) },
    });
    return { message: 'Hazmat material deleted successfully' };
  }

  async updateHazmat(tenantId: string, id: string, dto: any) {
    await this.findHazmatById(tenantId, id);
    return this.prisma.hazmat_materials.update({
      where: { hazmat_id: BigInt(id) },
      data: {
        material_name: dto.materialName,
        un_number: dto.unNumber,
        hazard_class: dto.hazardClass,
        packing_group: dto.packingGroup,
        required_storage_conditions: dto.requiredStorageConditions,
        max_storage_quantity: dto.maxStorageQuantity ? dto.maxStorageQuantity : undefined,
        storage_temperature_min: dto.storageTemperatureMin ? dto.storageTemperatureMin : undefined,
        storage_temperature_max: dto.storageTemperatureMax ? dto.storageTemperatureMax : undefined,
        requires_ventilation: dto.requiresVentilation,
        requires_grounding: dto.requiresGrounding,
        incompatible_materials: dto.incompatibleMaterials,
        handling_instructions: dto.handlingInstructions,
        ppe_requirements: dto.ppeRequirements,
        emergency_procedures: dto.emergencyProcedures,
        spill_response: dto.spillResponse,
        sds_document_url: dto.sdsDocumentUrl,
        sds_last_updated: dto.sdsLastUpdated ? new Date(dto.sdsLastUpdated) : undefined,
        dot_regulated: dto.dotRegulated,
        epa_regulated: dto.epaRegulated,
        osha_regulated: dto.oshaRegulated,
        is_active: dto.isActive,
        updated_by: dto.updatedBy,
      },
    });
  }
}
