import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { CustomersService } from '../customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/create-customer.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/customers')
@UseGuards(CaslGuard)
export class CustomersWebController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Customer' })
  async create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Customer' })
  @ApiQuery({ name: 'isActive', required: false })
  async findAll(@Req() req: any, @Query('isActive') isActive?: string) {
    const activeFilter = isActive === undefined ? undefined : isActive === 'true';
    return this.customersService.findAll(req.tenantContext.getTenantId(), activeFilter);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Customer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.customersService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Customer' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Customer' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.customersService.delete(id, req.tenantContext.getTenantId());
  }
}
