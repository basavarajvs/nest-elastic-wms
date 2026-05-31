import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientAddressDto, UpdateClientAddressDto } from '../dtos/client-address.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/client-addresses')
@UseGuards(CaslGuard)
export class ClientAddressWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Client' })
  async create(@Req() req: any, @Body() dto: CreateClientAddressDto) {
    const tenantId = req.tenantContext.getTenantId();
    const client = await (this.prisma as any).client.findFirst({ where: { id: dto.clientId, tenantId } });
    if (!client) throw new BadRequestException('Client not found');
    return (this.prisma as any).clientAddress.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        addressType: dto.addressType,
        addressLine1: dto.addressLine1 || null,
        addressLine2: dto.addressLine2 || null,
        city: dto.city || null,
        state: dto.state || null,
        postalCode: dto.postalCode || null,
        countryCode: dto.countryCode || null,
        isDefault: dto.isDefault ?? false,
        isActive: true,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).clientAddress.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const addr = await (this.prisma as any).clientAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Client address not found');
    return addr;
  }

  @Get('by-client/:clientId')
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findByClientId(@Req() req: any, @Param('clientId') clientId: string) {
    return (this.prisma as any).clientAddress.findMany({
      where: { clientId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Client' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientAddressDto) {
    const addr = await (this.prisma as any).clientAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Client address not found');
    return (this.prisma as any).clientAddress.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Client' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const addr = await (this.prisma as any).clientAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Client address not found');
    await (this.prisma as any).clientAddress.delete({ where: { id } });
    return { success: true };
  }
}