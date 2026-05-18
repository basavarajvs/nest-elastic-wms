import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryTransferService } from '../inventory-transfer.service';
import { CreateTransferDto } from '../dtos/transfer.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('/api/v1/wms/web/transfers')
@UseGuards(CaslGuard)
export class TransferWebController {
  constructor(private readonly transferService: InventoryTransferService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'InventoryTransfer' })
  async create(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.transferService.create(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post(':id/dispatch')
  @CheckAbility({ action: 'update', subject: 'InventoryTransfer' })
  async dispatch(@Req() req: any, @Param('id') id: string) {
    return this.transferService.initiateDispatch(id, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'InventoryTransfer' })
  async list(@Req() req: any, @Query('status') status: string, @Query('transferType') transferType: string) {
    return this.transferService.list(req.tenantContext.getTenantId(), { status, transferType });
  }
}
