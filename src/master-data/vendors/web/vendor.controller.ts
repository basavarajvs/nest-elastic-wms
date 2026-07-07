import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { VendorService } from '../vendor.service';
import { VendorResponseDto, CreateVendorDto, UpdateVendorDto, CreateVendorAddressDto, CreateVendorContactDto } from '../dtos/vendor-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Vendors')
@Controller('web/vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post() @ApiOperation({ summary: 'Create vendor' })
  @ApiCreatedResponse({ type: VendorResponseDto })
  async create(@Req() req: any, @Body() dto: CreateVendorDto) {
    return this.vendorService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List vendors' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.vendorService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get vendor with contacts' })
  @ApiOkResponse({ type: VendorResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update vendor' })
  @ApiOkResponse({ type: VendorResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Post(':id/addresses') @ApiOperation({ summary: 'Add vendor address' })
  @ApiCreatedResponse({ type: VendorResponseDto })
  async addAddress(@Req() req: any, @Param('id') id: string, @Body() dto: CreateVendorAddressDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.vendorService.findById(tenantId, BigInt(id));
  }
  @Post(':id/contacts') @ApiOperation({ summary: 'Add vendor contact' })
  @ApiCreatedResponse({ type: VendorResponseDto })
  async addContact(@Req() req: any, @Param('id') id: string, @Body() dto: CreateVendorContactDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.vendorService.findById(tenantId, BigInt(id));
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete vendor' })
  @ApiOkResponse({ type: VendorResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.vendorService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
