import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGrnLineDto, UpdateGrnLineDto } from '../dtos/grn-line.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/grn-lines')
@UseGuards(CaslGuard)
export class GrnLineWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'GoodsReceipt' })
  @ApiQuery({ name: 'grnId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Req() req: any,
    @Query('grnId') grnId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenantId };
    if (grnId) where.receiptId = grnId;

    const pg = page || 1;
    const lm = Math.min(limit || 200, 200);

    const [lines, total] = await Promise.all([
      (this.prisma as any).goodsReceiptLine.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'asc' },
      }),
      (this.prisma as any).goodsReceiptLine.count({ where }),
    ]);

    const enriched = await this.enrichLines(lines, tenantId);
    return { data: enriched, total };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'GoodsReceipt' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id, tenantId },
    });
    if (!line) throw new NotFoundException('GRN line not found');
    const enriched = await this.enrichLines([line], tenantId);
    return enriched[0];
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'GoodsReceipt' })
  async create(@Req() req: any, @Body() dto: CreateGrnLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const grn = await (this.prisma as any).goodsReceipt.findFirst({
      where: { id: dto.grnId, tenantId },
    });
    if (!grn) throw new BadRequestException('GRN not found');

    const lineCount = await (this.prisma as any).goodsReceiptLine.count({
      where: { receiptId: dto.grnId, tenantId },
    });

    const line = await (this.prisma as any).goodsReceiptLine.create({
      data: {
        tenantId,
        facilityId: grn.facilityId,
        receiptId: dto.grnId,
        productId: dto.productId,
        expectedQuantity: dto.expectedQuantity,
        receivedQuantity: dto.receivedQuantity,
        damagedQuantity: dto.damagedQuantity ?? 0,
        uomId: dto.uomId,
        lotNumber: dto.lotNumber || null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        lineNumber: lineCount + 1,
        notes: dto.notes || null,
      },
    });
    return line;
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateGrnLineDto) {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('GRN line not found');
    const data: any = {};
    if (dto.receivedQuantity !== undefined) data.receivedQuantity = dto.receivedQuantity;
    if (dto.damagedQuantity !== undefined) data.damagedQuantity = dto.damagedQuantity;
    if (dto.lotNumber !== undefined) data.lotNumber = dto.lotNumber;
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return (this.prisma as any).goodsReceiptLine.update({ where: { id }, data });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'GoodsReceipt' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).goodsReceiptLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('GRN line not found');
    await (this.prisma as any).goodsReceiptLine.delete({ where: { id } });
    return { success: true };
  }

  private computeVarianceType(expected: number, received: number, damaged: number): string {
    if (damaged > 0) return 'DAMAGED';
    if (received < expected) return 'SHORT';
    if (received > expected) return 'OVER';
    return 'NONE';
  }

  private async enrichLines(lines: any[], tenantId: string): Promise<any[]> {
    const productIds = [...new Set(lines.map((l: any) => l.productId))];
    const products = await (this.prisma as any).product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p.name]));
    return lines.map((l: any) => ({
      id: l.id,
      grnId: l.receiptId,
      productId: l.productId,
      productName: productMap.get(l.productId) || null,
      expectedQuantity: l.expectedQuantity,
      receivedQuantity: l.receivedQuantity,
      uomId: l.uomId,
      lotNumber: l.lotNumber,
      expiryDate: l.expiryDate ? l.expiryDate.toISOString() : null,
      varianceType: this.computeVarianceType(l.expectedQuantity, l.receivedQuantity, l.damagedQuantity),
      damagedQuantity: l.damagedQuantity,
      lineNumber: l.lineNumber,
      notes: l.notes,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  }
}
