import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequirementDto, UpdateAuditDto, CreateHazmatDto } from './dtos/compliance.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRequirement(dto: CreateRequirementDto, tenantId: string): Promise<any> {
    return this.prisma.complianceRequirement.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        complianceType: dto.complianceType,
        requirementCode: dto.requirementCode,
        description: dto.description,
        applicableEntity: dto.applicableEntity,
        frequencyType: dto.frequencyType,
      },
    });
  }

  async listRequirements(tenantId: string, filters?: { facilityId?: string; complianceType?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.complianceType) where.complianceType = filters.complianceType;
    return this.prisma.complianceRequirement.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createAudit(tenantId: string, facilityId: string, requirementId: string, scheduledDate?: string, auditedByUserId?: string): Promise<any> {
    const req = await this.prisma.complianceRequirement.findFirst({
      where: { id: requirementId, tenantId },
    });
    if (!req) throw new NotFoundException('Compliance requirement not found');

    const count = await this.prisma.complianceAudit.count({
      where: { tenantId, facilityId },
    });
    const auditNumber = `AUD-${facilityId.slice(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    return this.prisma.complianceAudit.create({
      data: {
        tenantId,
        facilityId,
        requirementId,
        auditNumber,
        status: 'SCHEDULED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        auditedByUserId,
      },
    });
  }

  async updateAudit(id: string, dto: UpdateAuditDto, tenantId: string): Promise<any> {
    const audit = await this.prisma.complianceAudit.findFirst({ where: { id, tenantId } });
    if (!audit) throw new NotFoundException('Compliance audit not found');

    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.result !== undefined) {
      updateData.result = dto.result;
      updateData.completedAt = new Date();
    }
    if (dto.findings !== undefined) updateData.findings = dto.findings;
    if (dto.correctiveActions !== undefined) updateData.correctiveActions = dto.correctiveActions;

    return this.prisma.complianceAudit.update({ where: { id }, data: updateData });
  }

  async registerHazmat(dto: CreateHazmatDto, tenantId: string): Promise<any> {
    return this.prisma.hazmatMaterial.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        hazardClass: dto.hazardClass,
        division: dto.division,
        unNumber: dto.unNumber,
        packingGroup: dto.packingGroup,
        properShippingName: dto.properShippingName,
        flashPoint: dto.flashPoint,
        storageGroup: dto.storageGroup,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
        msdsUrl: dto.msdsUrl,
      },
    });
  }

  async listHazmat(tenantId: string, filters?: { facilityId?: string; hazardClass?: string }): Promise<any> {
    const where: any = { tenantId };
    if (filters?.facilityId) where.facilityId = filters.facilityId;
    if (filters?.hazardClass) where.hazardClass = filters.hazardClass;
    return this.prisma.hazmatMaterial.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
}
