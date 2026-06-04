import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCycleCountLineDto, UpdateCycleCountLineDto } from '../dtos/count.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/cycle-count-lines')
@UseGuards(CaslGuard)
export class CountLineWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  @ApiQuery({ name: 'countId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Req() req: any,
    @Query('countId') countId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenantId };
    if (countId) where.countId = countId;

    const pg = page || 1;
    const lm = Math.min(limit || 200, 200);

    const [lines, total] = await Promise.all([
      (this.prisma as any).cycleCountLine.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'asc' },
      }),
      (this.prisma as any).cycleCountLine.count({ where }),
    ]);

    return { data: lines, total };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CycleCount' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).cycleCountLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Cycle count line not found');
    return line;
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'CycleCount' })
  async create(@Req() req: any, @Body() dto: CreateCycleCountLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    const count = await (this.prisma as any).cycleCount.findFirst({
      where: { id: dto.countId, tenantId },
    });
    if (!count) throw new BadRequestException('Cycle count not found');

    const line = await (this.prisma as any).cycleCountLine.create({
      data: {
        tenantId,
        facilityId: count.facilityId,
        countId: dto.countId,
        productId: dto.productId,
        locationId: dto.locationId,
        lotId: dto.lotId || null,
        uomId: dto.uomId,
        systemQuantity: dto.systemQuantity ?? 0,
      },
    });
    return line;
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CycleCount' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCycleCountLineDto) {
    const line = await (this.prisma as any).cycleCountLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Cycle count line not found');
    const data: any = {};
    if (dto.countedQuantity !== undefined) {
      data.countedQuantity = dto.countedQuantity;
      data.varianceQuantity = dto.countedQuantity - line.systemQuantity;
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.lotId !== undefined) data.lotId = dto.lotId;
    return (this.prisma as any).cycleCountLine.update({ where: { id }, data });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CycleCount' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const line = await (this.prisma as any).cycleCountLine.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!line) throw new NotFoundException('Cycle count line not found');
    await (this.prisma as any).cycleCountLine.delete({ where: { id } });
    return { success: true };
  }
}
