import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientContactDto, UpdateClientContactDto } from '../dtos/client-contact.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/client-contacts')
@UseGuards(CaslGuard)
export class ClientContactWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Client' })
  async create(@Req() req: any, @Body() dto: CreateClientContactDto) {
    const tenantId = req.tenantContext.getTenantId();
    const client = await (this.prisma as any).client.findFirst({ where: { id: dto.clientId, tenantId } });
    if (!client) throw new BadRequestException('Client not found');
    return (this.prisma as any).clientContact.create({
      data: {
        tenantId,
        clientId: dto.clientId,
        firstName: dto.firstName,
        lastName: dto.lastName || null,
        jobTitle: dto.jobTitle || null,
        email: dto.email || null,
        phone: dto.phone || null,
        isPrimary: dto.isPrimary ?? false,
        isActive: true,
      },
    });
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findAll(@Req() req: any) {
    return (this.prisma as any).clientContact.findMany({
      where: { tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const contact = await (this.prisma as any).clientContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Client contact not found');
    return contact;
  }

  @Get('by-client/:clientId')
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findByClientId(@Req() req: any, @Param('clientId') clientId: string) {
    return (this.prisma as any).clientContact.findMany({
      where: { clientId, tenantId: req.tenantContext.getTenantId() },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Client' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientContactDto) {
    const contact = await (this.prisma as any).clientContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Client contact not found');
    return (this.prisma as any).clientContact.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Client' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const contact = await (this.prisma as any).clientContact.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!contact) throw new NotFoundException('Client contact not found');
    await (this.prisma as any).clientContact.delete({ where: { id } });
    return { success: true };
  }
}