import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomerService } from '../customer.service';

@ApiTags('Customers')
@Controller('web/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post() @ApiOperation({ summary: 'Create customer' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.customerService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List customers' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.customerService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get customer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.customerService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update customer' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.customerService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete customer' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.customerService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
