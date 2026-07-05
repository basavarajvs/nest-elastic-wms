import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InspectionProfileService {
  private readonly logger = new Logger(InspectionProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const profile = await this.prisma.inspection_profiles.create({
      data: {
        tenant_id: tenantId,
        profile_name: dto.profileName,
        description: dto.description,
        is_active: dto.isActive ?? true,
      },
    });
    if (dto.checklistItems?.length) {
      await this.prisma.inspection_checklist_items.createMany({
        data: dto.checklistItems.map((item: any) => ({
          profile_id: profile.profile_id,
          check_type: item.checkType,
          check_label: item.checkLabel,
          is_mandatory: item.isMandatory ?? true,
          sort_order: item.sortOrder,
          acceptable_criteria: item.acceptableCriteria,
        })),
      });
    }
    return this.findById(tenantId, profile.profile_id);
  }

  async findAll(tenantId: string) {
    return this.prisma.inspection_profiles.findMany({
      where: { tenant_id: tenantId },
      orderBy: { profile_name: 'asc' },
    });
  }

  async findById(tenantId: string, profileId: bigint) {
    const profile = await this.prisma.inspection_profiles.findFirst({
      where: { tenant_id: tenantId, profile_id: profileId },
    });
    if (!profile) throw new NotFoundException('Inspection profile not found');
    const checklist = await this.prisma.inspection_checklist_items.findMany({
      where: { profile_id: profileId },
      orderBy: { sort_order: 'asc' },
    });
    return { ...profile, checklist };
  }

  async update(tenantId: string, profileId: bigint, dto: any) {
    await this.findById(tenantId, profileId);
    await this.prisma.inspection_profiles.updateMany({
      where: { tenant_id: tenantId, profile_id: profileId },
      data: {
        profile_name: dto.profileName,
        description: dto.description,
        is_active: dto.isActive,
      },
    });
    if (dto.checklistItems) {
      await this.prisma.inspection_checklist_items.deleteMany({
        where: { profile_id: profileId },
      });
      await this.prisma.inspection_checklist_items.createMany({
        data: dto.checklistItems.map((item: any) => ({
          profile_id: profileId,
          check_type: item.checkType,
          check_label: item.checkLabel,
          is_mandatory: item.isMandatory ?? true,
          sort_order: item.sortOrder,
          acceptable_criteria: item.acceptableCriteria,
        })),
      });
    }
    return this.findById(tenantId, profileId);
  }

  async delete(tenantId: string, profileId: bigint) {
    await this.findById(tenantId, profileId);
    await this.prisma.inspection_checklist_items.deleteMany({ where: { profile_id: profileId } });
    await this.prisma.inspection_profiles.deleteMany({
      where: { tenant_id: tenantId, profile_id: profileId },
    });
  }

  async assignToProduct(tenantId: string, dto: any) {
    await this.findById(tenantId, BigInt(dto.profileId));
    const existing = await this.prisma.product_inspection_profiles.findFirst({
      where: {
        tenant_id: tenantId,
        product_id: BigInt(dto.productId),
        profile_id: BigInt(dto.profileId),
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
      },
    });
    if (existing) {
      await this.prisma.product_inspection_profiles.updateMany({
        where: { mapping_id: existing.mapping_id },
        data: {
          min_expiry_days: dto.minExpiryDays,
          temperature_min: dto.temperatureMin,
          temperature_max: dto.temperatureMax,
          sampling_percentage: dto.samplingPercentage,
          sampling_method: dto.samplingMethod || '100_PERCENT',
          is_active: true,
        },
      });
      return existing;
    }
    return this.prisma.product_inspection_profiles.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.productId),
        profile_id: BigInt(dto.profileId),
        vendor_id: dto.vendorId ? BigInt(dto.vendorId) : undefined,
        client_id: dto.clientId ? BigInt(dto.clientId) : undefined,
        min_expiry_days: dto.minExpiryDays,
        temperature_min: dto.temperatureMin,
        temperature_max: dto.temperatureMax,
        sampling_percentage: dto.samplingPercentage,
        sampling_method: dto.samplingMethod || '100_PERCENT',
        is_active: true,
      },
    });
  }

  async getProfileForProduct(tenantId: string, productId: bigint, vendorId?: bigint) {
    const mapping = await this.prisma.product_inspection_profiles.findFirst({
      where: {
        tenant_id: tenantId,
        product_id: productId,
        vendor_id: vendorId || undefined,
        is_active: true,
      },
    });
    if (!mapping) return null;
    return this.findById(tenantId, mapping.profile_id);
  }
}
