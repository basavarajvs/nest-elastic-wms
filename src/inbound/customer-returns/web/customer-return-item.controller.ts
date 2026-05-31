import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReturnItemStandaloneDto, UpdateReturnItemStandaloneDto } from '../dtos/return-item.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/customer-return-items')
@UseGuards(CaslGuard)
export class CustomerReturnItemWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CustomerReturn' })
  async create(@Req() req: any, @Body() dto: CreateReturnItemStandaloneDto) {
    const tenantId = req.tenantContext.getTenantId();
    const ret = await (this.prisma as any).customerReturn.findFirst({ where: { id: dto.returnId, tenantId } });
    if (!ret) throw new BadRequestException('Customer return not found');
    return (this.prisma as any).customerReturnItem.create({
      data: {
        tenantId,
        facilityId: ret.facilityId,
        returnId: dto.returnId,
        productId: dto.productId,
        expectedQty: dto.expectedQty,
        receivedQty: dto.receivedQty ?? 0,
        condition: dto.condition || null,
        disposition: dto.disposition || null,
        notes: dto.notes || null,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CustomerReturn' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).customerReturnItem.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CustomerReturn' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const item = await (this.prisma as any).customerReturnItem.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!item) throw new NotFoundException('Customer return item not found');
    return item;
  }

  @Get('by-return/:returnId')
  @CheckAbility({ action: 'read', subject: 'CustomerReturn' })
  async findByReturnId(@Req() req: any, @Param('returnId') returnId: string) {
    return (this.prisma as any).customerReturnItem.findMany({
      where: { returnId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CustomerReturn' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReturnItemStandaloneDto) {
    const item = await (this.prisma as any).customerReturnItem.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!item) throw new NotFoundException('Customer return item not found');
    return (this.prisma as any).customerReturnItem.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CustomerReturn' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const item = await (this.prisma as any).customerReturnItem.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!item) throw new NotFoundException('Customer return item not found');
    await (this.prisma as any).customerReturnItem.delete({ where: { id } });
    return { success: true };
  }
}