import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemperatureLogService {
  private readonly logger = new Logger(TemperatureLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: any) {
    return this.prisma.inspection_temperature_logs.create({
      data: {
        inspection_id: BigInt(dto.inspection_id),
        reading_celsius: dto.reading_celsius,
        acceptable_min: dto.acceptable_min,
        acceptable_max: dto.acceptable_max,
        is_compliant: dto.is_compliant ?? true,
        device_id: dto.device_id,
      },
    });
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.inspectionId) where.inspection_id = BigInt(query.inspectionId);
    if (query.isCompliant !== undefined) where.is_compliant = query.isCompliant;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.inspection_temperature_logs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { logged_at: 'desc' },
      }),
      this.prisma.inspection_temperature_logs.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(logId: bigint) {
    const record = await this.prisma.inspection_temperature_logs.findFirst({
      where: { log_id: logId },
    });
    if (!record) throw new NotFoundException('Temperature log not found');
    return record;
  }

  async update(logId: bigint, dto: any) {
    await this.findById(logId);
    await this.prisma.inspection_temperature_logs.updateMany({
      where: { log_id: logId },
      data: {
        reading_celsius: dto.reading_celsius,
        acceptable_min: dto.acceptable_min,
        acceptable_max: dto.acceptable_max,
        is_compliant: dto.is_compliant,
        device_id: dto.device_id,
      },
    });
    return this.findById(logId);
  }

  async delete(logId: bigint) {
    const record = await this.findById(logId);
    await this.prisma.inspection_temperature_logs.deleteMany({
      where: { log_id: logId },
    });
    return record;
  }
}
