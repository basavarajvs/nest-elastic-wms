import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOperationsByWorkOrderId(tenantId: string, workOrderId: bigint) {
    return this.prisma.work_order_operations.findMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId },
      orderBy: { operation_number: 'asc' },
    });
  }

  async delete(tenantId: string, workOrderId: bigint, operationId: bigint) {
    const entity = await this.prisma.work_order_operations.findFirst({
      where: { tenant_id: tenantId, work_order_id: workOrderId, operation_id: operationId },
    });
    await this.prisma.work_order_operations.deleteMany({
      where: { tenant_id: tenantId, work_order_id: workOrderId, operation_id: operationId },
    });
    return entity;
  }

  async startOperation(tenantId: string, operationId: bigint, userId?: string) {
    const op = await this.prisma.work_order_operations.findFirst({
      where: { tenant_id: tenantId, operation_id: operationId },
    });
    if (!op) throw new NotFoundException('Operation not found');
    if (op.status !== 'PENDING') throw new BadRequestException('Only PENDING operations can be started');

    await this.prisma.work_order_operations.updateMany({
      where: { tenant_id: tenantId, operation_id: operationId },
      data: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        assigned_to_user_id: userId,
        updated_by: userId,
      },
    });
    return this.prisma.work_order_operations.findFirst({
      where: { tenant_id: tenantId, operation_id: operationId },
    });
  }

  async completeOperation(tenantId: string, operationId: bigint, userId?: string) {
    const op = await this.prisma.work_order_operations.findFirst({
      where: { tenant_id: tenantId, operation_id: operationId },
    });
    if (!op) throw new NotFoundException('Operation not found');
    if (op.status !== 'IN_PROGRESS') throw new BadRequestException('Only IN_PROGRESS operations can be completed');

    await this.prisma.work_order_operations.updateMany({
      where: { tenant_id: tenantId, operation_id: operationId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        updated_by: userId,
      },
    });
    return this.prisma.work_order_operations.findFirst({
      where: { tenant_id: tenantId, operation_id: operationId },
    });
  }
}
