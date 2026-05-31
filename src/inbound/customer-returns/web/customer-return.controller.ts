import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CustomerReturnService } from '../customer-return.service';
import { CreateCustomerReturnDto } from '../dtos/create-return.dto';
import { UpdateCustomerReturnDto } from '../dtos/update-return.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/customer-returns')
@UseGuards(CaslGuard)
export class CustomerReturnWebController {
  constructor(private readonly returnService: CustomerReturnService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'CustomerReturn' })
  async create(@Req() req: any, @Body() dto: CreateCustomerReturnDto) {
    return this.returnService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'CustomerReturn' })
  async findAll(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: string,
  ) {
    return this.returnService.findAll(req.tenantContext.getTenantId(), facilityId, status);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'CustomerReturn' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.returnService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'CustomerReturn' })
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerReturnDto) {
    return this.returnService.updateStatus(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'CustomerReturn' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.returnService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
