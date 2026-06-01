import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAsnLineDto, UpdateAsnLineDto } from '../dtos/asn-line.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/asn-lines')
@UseGuards(CaslGuard)
export class AsnLineWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'AdvanceShipNotice' })
  @ApiQuery({ name: 'asnId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Req() req: any,
    @Query('asnId') asnId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenantId };
    if (asnId) where.asnId = asnId;

    const pg = page || 1;
    const lm = Math.min(limit || 200, 200);

    const [lines, total] = await Promise.all([
      (this.prisma as any).asnLine.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'asc' },
      }),
      (this.prisma as any).asnLine.count({ where }),
    ]);

    const enriched = await this.enrichLines(lines, tenantId);
    return { data: enriched, total };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'AdvanceShipNotice' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).asnLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('ASN line not found');
    return line;
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'AdvanceShipNotice' })
  async create(@Req() req: any, @Body() dto: CreateAsnLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const asn = await (this.prisma as any).advanceShipNotice.findFirst({
      where: { id: dto.asnId, tenantId },
    });
    if (!asn) throw new BadRequestException('ASN not found');

    const lineCount = await (this.prisma as any).asnLine.count({
      where: { asnId: dto.asnId, tenantId },
    });

    const line = await (this.prisma as any).asnLine.create({
      data: {
        tenantId,
        facilityId: asn.facilityId,
        asnId: dto.asnId,
        productId: dto.productId,
        expectedQuantity: dto.expectedQuantity,
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
  @CheckAbility({ action: 'update', subject: 'AdvanceShipNotice' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAsnLineDto) {
    const line = await (this.prisma as any).asnLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('ASN line not found');
    const data: any = {};
    if (dto.productId !== undefined) data.productId = dto.productId;
    if (dto.expectedQuantity !== undefined) data.expectedQuantity = dto.expectedQuantity;
    if (dto.receivedQuantity !== undefined) data.receivedQuantity = dto.receivedQuantity;
    if (dto.uomId !== undefined) data.uomId = dto.uomId;
    if (dto.lotNumber !== undefined) data.lotNumber = dto.lotNumber;
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return (this.prisma as any).asnLine.update({ where: { id }, data });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'AdvanceShipNotice' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).asnLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('ASN line not found');
    await (this.prisma as any).asnLine.delete({ where: { id } });
    return { success: true };
  }

  private async enrichLines(lines: any[], tenantId: string): Promise<any[]> {
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await (this.prisma as any).product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p: any) => [p.id, p.name]));
    return lines.map((l) => ({
      id: l.id,
      asnId: l.asnId,
      productId: l.productId,
      productName: productMap.get(l.productId) || null,
      expectedQuantity: l.expectedQuantity,
      receivedQuantity: l.receivedQuantity,
      uomId: l.uomId,
      lotNumber: l.lotNumber,
      expiryDate: l.expiryDate ? l.expiryDate.toISOString() : null,
      lineNumber: l.lineNumber,
      notes: l.notes,
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  }
}
