import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferLineDto, UpdateTransferLineDto, TransferLineFilterDto } from '../dtos/transfer.dto';
import { InventoryTransferService } from '../inventory-transfer.service';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/transfer-lines')
@UseGuards(CaslGuard)
export class TransferLineWebController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transferService: InventoryTransferService,
  ) {}

  @Get()
  @CheckAbility({ action: 'list', subject: 'InventoryTransferLine' })
  @ApiQuery({ name: 'transferId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Req() req: any, @Query() filter: TransferLineFilterDto) {
    return this.transferService.listLines(req.tenantContext.getTenantId(), filter);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'InventoryTransferLine' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.transferService.getLine(id, req.tenantContext.getTenantId());
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'InventoryTransferLine' })
  async create(@Req() req: any, @Body() dto: CreateTransferLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const transfer = await (this.prisma as any).inventoryTransfer.findFirst({
      where: { id: dto.transferId, tenantId },
    });
    if (!transfer) throw new BadRequestException('Transfer not found');

    const lineCount = await (this.prisma as any).inventoryTransferLine.count({
      where: { transferId: dto.transferId, tenantId },
    });

    const line = await (this.prisma as any).inventoryTransferLine.create({
      data: {
        tenantId,
        facilityId: transfer.facilityId,
        transferId: dto.transferId,
        productId: dto.productId,
        lotId: dto.lotId || null,
        uomId: dto.uomId,
        quantityRequested: dto.quantityRequested,
      },
    });
    return line;
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'InventoryTransferLine' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTransferLineDto) {
    return this.transferService.updateLine(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'InventoryTransferLine' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const line = await (this.prisma as any).inventoryTransferLine.findFirst({
      where: { id, tenantId },
    });
    if (!line) throw new NotFoundException('Transfer line not found');
    await (this.prisma as any).inventoryTransferLine.delete({ where: { id } });
    return { success: true };
  }
}
