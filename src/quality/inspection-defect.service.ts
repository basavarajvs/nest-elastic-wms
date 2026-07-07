import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionDefectService {
  private readonly logger = new Logger(InspectionDefectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.inspection_defects.create({
      data: {
        inspection_id: BigInt(dto.inspection_id),
        defect_code_id: BigInt(dto.defect_code_id),
        quantity_affected: dto.quantity_affected,
        notes: dto.notes,
      },
    });
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.inspectionId) where.inspection_id = BigInt(query.inspectionId);
    if (query.defectCodeId) where.defect_code_id = BigInt(query.defectCodeId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.inspection_defects.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recorded_at: 'desc' },
      }),
      this.prisma.inspection_defects.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(defectId: bigint) {
    const record = await this.prisma.inspection_defects.findFirst({
      where: { defect_id: defectId },
    });
    if (!record) throw new NotFoundException('Inspection defect not found');
    return record;
  }

  async update(defectId: bigint, dto: any) {
    await this.findById(defectId);
    await this.prisma.inspection_defects.updateMany({
      where: { defect_id: defectId },
      data: {
        defect_code_id: dto.defect_code_id ? BigInt(dto.defect_code_id) : undefined,
        quantity_affected: dto.quantity_affected,
        notes: dto.notes,
      },
    });
    return this.findById(defectId);
  }

  async delete(defectId: bigint) {
    const record = await this.findById(defectId);
    await this.prisma.inspection_defects.deleteMany({
      where: { defect_id: defectId },
    });
    return record;
  }
}
