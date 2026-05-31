import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PurchaseOrderService } from '../purchase-order.service';
import { CreatePurchaseOrderDto } from '../dtos/create-po.dto';
import { UpdatePurchaseOrderDto } from '../dtos/update-po.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/purchase-orders')
@UseGuards(CaslGuard)
export class PurchaseOrderWebController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'PurchaseOrder' })
  async create(@Req() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'PurchaseOrder' })
  async findAll(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: string,
  ) {
    return this.poService.findAll(req.tenantContext.getTenantId(), facilityId, status);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'PurchaseOrder' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.poService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'PurchaseOrder' })
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.poService.updateStatus(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'PurchaseOrder' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.poService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
