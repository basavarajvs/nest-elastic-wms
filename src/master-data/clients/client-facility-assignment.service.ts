import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientFacilityAssignmentDto, UpdateClientFacilityAssignmentDto } from './dtos/create-client-facility-assignment.dto';

@Injectable()
export class ClientFacilityAssignmentService {
  private readonly logger = new Logger(ClientFacilityAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientFacilityAssignmentDto, tenantId: string) {
    const existing = await (this.prisma as any).clientFacilityAssignment.findFirst({
      where: { tenantId, clientId: dto.clientId, facilityId: dto.facilityId },
    });
    if (existing) throw new BadRequestException('Assignment already exists for this client and facility');

    return (this.prisma as any).clientFacilityAssignment.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        facilityId: dto.facilityId,
        isActive: dto.isActive ?? true,
        effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async findAll(tenantId: string, clientId?: string, facilityId?: string) {
    const where: any = { tenantId };
    if (clientId) where.clientId = clientId;
    if (facilityId) where.facilityId = facilityId;
    return (this.prisma as any).clientFacilityAssignment.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, tenantId: string) {
    const a = await (this.prisma as any).clientFacilityAssignment.findFirst({ where: { id, tenantId } });
    if (!a) throw new NotFoundException('Assignment not found');
    return a;
  }

  async update(id: string, tenantId: string, dto: UpdateClientFacilityAssignmentDto) {
    const a = await (this.prisma as any).clientFacilityAssignment.findFirst({ where: { id, tenantId } });
    if (!a) throw new NotFoundException('Assignment not found');
    const data: any = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.effectiveAt !== undefined) data.effectiveAt = new Date(dto.effectiveAt);
    if (dto.expiresAt !== undefined) data.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return (this.prisma as any).clientFacilityAssignment.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const a = await (this.prisma as any).clientFacilityAssignment.findFirst({ where: { id, tenantId } });
    if (!a) throw new NotFoundException('Assignment not found');
    await (this.prisma as any).clientFacilityAssignment.delete({ where: { id } });
    return { success: true };
  }
}
