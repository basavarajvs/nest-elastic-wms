import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePurchaseOrderLineDto, UpdatePurchaseOrderLineDto } from '../dtos/purchase-order-line.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/purchase-order-lines')
@UseGuards(CaslGuard)
export class PurchaseOrderLineWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'PurchaseOrder' })
  async create(@Req() req: any, @Body() dto: CreatePurchaseOrderLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const po = await (this.prisma as any).purchaseOrder.findFirst({ where: { id: dto.poId, tenantId } });
    if (!po) throw new BadRequestException('Purchase order not found');
    return (this.prisma as any).purchaseOrderLine.create({
      data: {
        tenantId,
        facilityId: po.facilityId,
        poId: dto.poId,
        lineNumber: dto.lineNumber,
        productId: dto.productId,
        orderedQuantity: dto.orderedQuantity,
        unitPrice: dto.unitPrice ?? null,
        uomId: dto.uomId,
        notes: dto.notes || null,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'PurchaseOrder' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).purchaseOrderLine.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'PurchaseOrder' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).purchaseOrderLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Purchase order line not found');
    return line;
  }

  @Get('by-po/:poId')
  @CheckAbility({ action: 'read', subject: 'PurchaseOrder' })
  async findByPoId(@Req() req: any, @Param('poId') poId: string) {
    return (this.prisma as any).purchaseOrderLine.findMany({
      where: { poId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { lineNumber: 'asc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'PurchaseOrder' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePurchaseOrderLineDto) {
    const line = await (this.prisma as any).purchaseOrderLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Purchase order line not found');
    return (this.prisma as any).purchaseOrderLine.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'PurchaseOrder' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).purchaseOrderLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Purchase order line not found');
    await (this.prisma as any).purchaseOrderLine.delete({ where: { id } });
    return { success: true };
  }
}