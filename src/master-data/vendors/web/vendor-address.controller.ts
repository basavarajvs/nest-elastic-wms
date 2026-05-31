import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorAddressDto, UpdateVendorAddressDto } from '../dtos/vendor-address.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/vendor-addresses')
@UseGuards(CaslGuard)
export class VendorAddressWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Vendor' })
  async create(@Req() req: any, @Body() dto: CreateVendorAddressDto) {
    const tenantId = req.tenantContext.getTenantId();
    const vendor = await (this.prisma as any).vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new BadRequestException('Vendor not found');
    return (this.prisma as any).vendorAddress.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        addressType: dto.addressType || null,
        addressLine1: dto.addressLine1 || null,
        addressLine2: dto.addressLine2 || null,
        city: dto.city || null,
        state: dto.state || null,
        postalCode: dto.postalCode || null,
        country: dto.country || null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).vendorAddress.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const addr = await (this.prisma as any).vendorAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Vendor address not found');
    return addr;
  }

  @Get('by-vendor/:vendorId')
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findByVendorId(@Req() req: any, @Param('vendorId') vendorId: string) {
    return (this.prisma as any).vendorAddress.findMany({
      where: { vendorId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Vendor' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVendorAddressDto) {
    const addr = await (this.prisma as any).vendorAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Vendor address not found');
    return (this.prisma as any).vendorAddress.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Vendor' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const addr = await (this.prisma as any).vendorAddress.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!addr) throw new NotFoundException('Vendor address not found');
    await (this.prisma as any).vendorAddress.delete({ where: { id } });
    return { success: true };
  }
}