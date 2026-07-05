import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VendorService } from '../vendor.service';

@ApiTags('Vendors')
@Controller('web/vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post() @ApiOperation({ summary: 'Create vendor' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.vendorService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List vendors' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.vendorService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get vendor with contacts' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update vendor' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.vendorService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Post(':id/addresses') @ApiOperation({ summary: 'Add vendor address' })
  async addAddress(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.vendorService.findById(tenantId, BigInt(id));
  }
  @Post(':id/contacts') @ApiOperation({ summary: 'Add vendor contact' })
  async addContact(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.vendorService.findById(tenantId, BigInt(id));
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete vendor' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
