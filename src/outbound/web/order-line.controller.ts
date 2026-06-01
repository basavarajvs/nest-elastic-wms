import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderLineDto, UpdateOrderLineDto } from '../dtos/order-line.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/order-lines')
@UseGuards(CaslGuard)
export class OrderLineWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'SalesOrder' })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Req() req: any,
    @Query('orderId') orderId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenantId };
    if (orderId) where.orderId = orderId;

    const pg = page || 1;
    const lm = Math.min(limit || 200, 200);

    const [lines, total] = await Promise.all([
      (this.prisma as any).salesOrderLine.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'asc' },
      }),
      (this.prisma as any).salesOrderLine.count({ where }),
    ]);

    const enriched = await this.enrichLines(lines, tenantId);
    return { data: enriched, total };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'SalesOrder' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const line = await (this.prisma as any).salesOrderLine.findFirst({
      where: { id, tenantId },
    });
    if (!line) throw new NotFoundException('Order line not found');
    const enriched = await this.enrichLines([line], tenantId);
    return enriched[0];
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'SalesOrder' })
  async create(@Req() req: any, @Body() dto: CreateOrderLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const order = await (this.prisma as any).salesOrder.findFirst({
      where: { id: dto.orderId, tenantId },
    });
    if (!order) throw new BadRequestException('Order not found');

    const lineCount = await (this.prisma as any).salesOrderLine.count({
      where: { orderId: dto.orderId, tenantId },
    });

    const line = await (this.prisma as any).salesOrderLine.create({
      data: {
        tenantId,
        facilityId: order.facilityId,
        orderId: dto.orderId,
        productId: dto.productId,
        requestedQuantity: dto.quantity,
        uomId: dto.uomId,
        unitPrice: dto.unitPrice ?? null,
        lineNumber: lineCount + 1,
        notes: dto.notes || null,
      },
    });
    return line;
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'SalesOrder' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderLineDto) {
    const line = await (this.prisma as any).salesOrderLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Order line not found');
    const data: any = {};
    if (dto.quantity !== undefined) data.requestedQuantity = dto.quantity;
    if (dto.uomId !== undefined) data.uomId = dto.uomId;
    if (dto.unitPrice !== undefined) data.unitPrice = dto.unitPrice;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return (this.prisma as any).salesOrderLine.update({ where: { id }, data });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'SalesOrder' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).salesOrderLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Order line not found');
    await (this.prisma as any).salesOrderLine.delete({ where: { id } });
    return { success: true };
  }

  private async enrichLines(lines: any[], tenantId: string): Promise<any[]> {
    const productIds = [...new Set(lines.map((l: any) => l.productId))];
    const products = await (this.prisma as any).product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p.name]));

    const orderLineIds = lines.map((l: any) => l.id);
    const allocations = await (this.prisma as any).inventoryAllocation.findMany({
      where: { orderLineId: { in: orderLineIds }, tenantId },
      select: { orderLineId: true, quantityAllocated: true },
    });
    const allocMap = new Map<string, number>();
    for (const a of allocations) {
      allocMap.set(a.orderLineId, (allocMap.get(a.orderLineId) || 0) + a.quantityAllocated);
    }

    return lines.map((l: any) => ({
      id: l.id,
      orderId: l.orderId,
      productId: l.productId,
      productName: productMap.get(l.productId) || null,
      quantity: l.requestedQuantity,
      allocatedQuantity: allocMap.get(l.id) || 0,
      pickedQuantity: l.fulfilledQuantity || 0,
      packedQuantity: 0,
      shippedQuantity: 0,
      uomId: l.uomId,
      unitPrice: l.unitPrice,
      lineNumber: l.lineNumber,
      notes: l.notes,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  }
}
