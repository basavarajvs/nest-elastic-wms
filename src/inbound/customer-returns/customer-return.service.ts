import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerReturnDto } from './dtos/create-return.dto';
import { UpdateCustomerReturnDto } from './dtos/update-return.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CustomerReturnService {
  private readonly logger = new Logger(CustomerReturnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCustomerReturnDto, tenantId: string) {
    const existing = await (this.prisma as any).customerReturn.findFirst({
      where: { tenantId, facilityId: dto.facilityId, returnNumber: dto.returnNumber },
    });
    if (existing) {
      throw new BadRequestException(`Return ${dto.returnNumber} already exists`);
    }

    const ret = await (this.prisma as any).customerReturn.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        returnNumber: dto.returnNumber,
        clientCode: dto.clientCode || null,
        rmaNumber: dto.rmaNumber || null,
        carrier: dto.carrier || null,
        trackingNumber: dto.trackingNumber || null,
        notes: dto.notes || null,
        items: {
          create: dto.items.map((i) => ({
            tenantId,
            facilityId: dto.facilityId,
            productId: i.productId,
            expectedQty: i.expectedQty,
            condition: i.condition || null,
            notes: i.notes || null,
          })),
        },
      },
      include: { items: true },
    });

    this.logger.log(`Customer return created: ${dto.returnNumber}`);
    return ret;
  }

  async findAll(tenantId: string, facilityId?: string, status?: string) {
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;
    return (this.prisma as any).customerReturn.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const ret = await (this.prisma as any).customerReturn.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!ret) throw new NotFoundException('Customer return not found');
    return ret;
  }

  async updateStatus(id: string, tenantId: string, dto: UpdateCustomerReturnDto) {
    const ret = await (this.prisma as any).customerReturn.findFirst({ where: { id, tenantId } });
    if (!ret) throw new NotFoundException('Customer return not found');

    const updated = await (this.prisma as any).customerReturn.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes },
    });

    this.eventEmitter.emit('customer_return.status_changed', {
      returnId: id, returnNumber: ret.returnNumber, from: ret.status, to: dto.status, tenantId,
    });
    return updated;
  }

  async delete(id: string, tenantId: string) {
    const ret = await (this.prisma as any).customerReturn.findFirst({ where: { id, tenantId } });
    if (!ret) throw new NotFoundException('Customer return not found');
    await (this.prisma as any).customerReturn.delete({ where: { id } });
    this.logger.log(`Customer return deleted: ${ret.returnNumber}`);
  }
}
