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
        profile_name: dto.profile_name,
        description: dto.description,
        is_active: dto.is_active ?? true,
      },
    });
    if (dto.checklist_items?.length) {
      await this.prisma.inspection_checklist_items.createMany({
        data: dto.checklist_items.map((item: any) => ({
          profile_id: profile.profile_id,
          check_type: item.check_type,
          check_label: item.check_label,
          is_mandatory: item.is_mandatory ?? true,
          sort_order: item.sort_order,
          acceptable_criteria: item.acceptable_criteria,
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
        profile_name: dto.profile_name,
        description: dto.description,
        is_active: dto.is_active,
      },
    });
    if (dto.checklist_items) {
      await this.prisma.inspection_checklist_items.deleteMany({
        where: { profile_id: profileId },
      });
      await this.prisma.inspection_checklist_items.createMany({
        data: dto.checklist_items.map((item: any) => ({
          profile_id: profileId,
          check_type: item.check_type,
          check_label: item.check_label,
          is_mandatory: item.is_mandatory ?? true,
          sort_order: item.sort_order,
          acceptable_criteria: item.acceptable_criteria,
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
    await this.findById(tenantId, BigInt(dto.profile_id));
    const product = await this.prisma.products.findFirst({ where: { tenant_id: tenantId, product_id: BigInt(dto.product_id) } });
    const product_name = product?.product_name;
    const existing = await this.prisma.product_inspection_profiles.findFirst({
      where: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        profile_id: BigInt(dto.profile_id),
        vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : undefined,
      },
    });
    if (existing) {
      await this.prisma.product_inspection_profiles.updateMany({
        where: { mapping_id: existing.mapping_id },
        data: {
          min_expiry_days: dto.min_expiry_days,
          temperature_min: dto.temperature_min,
          temperature_max: dto.temperature_max,
          sampling_percentage: dto.sampling_percentage,
          sampling_method: dto.sampling_method || '100_PERCENT',
          is_active: true,
        },
      });
      return { ...existing, product_name };
    }
    const result = await this.prisma.product_inspection_profiles.create({
      data: {
        tenant_id: tenantId,
        product_id: BigInt(dto.product_id),
        profile_id: BigInt(dto.profile_id),
        vendor_id: dto.vendor_id ? BigInt(dto.vendor_id) : undefined,
        client_id: dto.client_id ? BigInt(dto.client_id) : undefined,
        min_expiry_days: dto.min_expiry_days,
        temperature_min: dto.temperature_min,
        temperature_max: dto.temperature_max,
        sampling_percentage: dto.sampling_percentage,
        sampling_method: dto.sampling_method || '100_PERCENT',
        is_active: true,
      },
    });
    return { ...result, product_name };
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
