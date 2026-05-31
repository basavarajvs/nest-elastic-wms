import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { VendorService } from '../vendor.service';
import { CreateVendorDto, UpdateVendorDto } from '../dtos/create-vendor.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/vendors')
@UseGuards(CaslGuard)
export class VendorWebController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Vendor' })
  async create(@Req() req: any, @Body() dto: CreateVendorDto) {
    return this.vendorService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findAll(@Req() req: any) {
    return this.vendorService.findAll(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Vendor' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Vendor' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Vendor' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.vendorService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
