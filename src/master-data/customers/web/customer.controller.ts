import { Controller, Delete, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CustomerService } from '../customer.service';
import { CustomerResponseDto, CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Customers')
@Controller('web/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post() @ApiOperation({ summary: 'Create customer' })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  async create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(req.tenantContext.getTenantId(), dto);
  }
  @Get() @ApiOperation({ summary: 'List customers' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.customerService.findAll(req.tenantContext.getTenantId(), query);
  }
  @Get(':id') @ApiOperation({ summary: 'Get customer' })
  @ApiOkResponse({ type: CustomerResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.customerService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }
  @Patch(':id') @ApiOperation({ summary: 'Update customer' })
  @ApiOkResponse({ type: CustomerResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(req.tenantContext.getTenantId(), BigInt(id), dto);
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete customer' })
  @ApiOkResponse({ type: CustomerResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.customerService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
