import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryTransferService } from '../inventory-transfer.service';
import { CreateTransferDto, WebReceiveTransferDto, UpdateTransferLineDto, TransferLineFilterDto } from '../dtos/transfer.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/transfers')
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

  @Post(':id/receive')
  @CheckAbility({ action: 'update', subject: 'InventoryTransfer' })
  async receive(@Req() req: any, @Param('id') id: string, @Body() dto: WebReceiveTransferDto) {
    return this.transferService.receiveLPN({ transferId: id, lpnNumber: dto.lpnNumber }, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get('lines')
  @CheckAbility({ action: 'list', subject: 'InventoryTransferLine' })
  async listLines(@Req() req: any, @Query() filter: TransferLineFilterDto) {
    return this.transferService.listLines(req.tenantContext.getTenantId(), filter);
  }

  @Get('lines/:id')
  @CheckAbility({ action: 'read', subject: 'InventoryTransferLine' })
  async getLine(@Req() req: any, @Param('id') id: string) {
    return this.transferService.getLine(id, req.tenantContext.getTenantId());
  }

  @Patch('lines/:id')
  @CheckAbility({ action: 'update', subject: 'InventoryTransferLine' })
  async updateLine(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTransferLineDto) {
    return this.transferService.updateLine(id, dto, req.tenantContext.getTenantId());
  }
}
