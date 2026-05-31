import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorContactDto, UpdateVendorContactDto } from '../dtos/vendor-contact.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/vendor-contacts')
@UseGuards(CaslGuard)
export class VendorContactWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Vendor' })
  async create(@Req() req: any, @Body() dto: CreateVendorContactDto) {
    const tenantId = req.tenantContext.getTenantId();
    const vendor = await (this.prisma as any).vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new BadRequestException('Vendor not found');
    return (this.prisma as any).vendorContact.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        email: dto.email || null,
        phone: dto.phone || null,
        isPrimary: dto.isPrimary ?? false,
        isActive: true,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).vendorContact.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const contact = await (this.prisma as any).vendorContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Vendor contact not found');
    return contact;
  }

  @Get('by-vendor/:vendorId')
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findByVendorId(@Req() req: any, @Param('vendorId') vendorId: string) {
    return (this.prisma as any).vendorContact.findMany({
      where: { vendorId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Vendor' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVendorContactDto) {
    const contact = await (this.prisma as any).vendorContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Vendor contact not found');
    return (this.prisma as any).vendorContact.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Vendor' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const contact = await (this.prisma as any).vendorContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Vendor contact not found');
    await (this.prisma as any).vendorContact.delete({ where: { id } });
    return { success: true };
  }
}