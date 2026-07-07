import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { TransfersService } from '../transfers.service';
import { InventoryTransferDto, InventoryTransferLineDto, TransferPaginatedDto, CreateTransferDto, DispatchTransferDto, ReceiveTransferDto, CancelTransferDto } from '../dtos/transfer.dto';

@ApiTags('Transfers')
@Controller('web/transfers')
@UseGuards(JwtAuthGuard, CaslGuard)
export class TransferWebController {
  constructor(private readonly service: TransfersService) {}

  @Post()
  @ApiCreatedResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Create, subject: 'InventoryTransfer' })
  async create(@Req() req: any, @Body() dto: CreateTransferDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOkResponse({ type: TransferPaginatedDto })
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryTransfer' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryTransfer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOkResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryTransfer' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, id);
  }

  @Get(':id/lines')
  @ApiOkResponse({ type: InventoryTransferLineDto })
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryTransfer' })
  async findLines(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findLines(tenantId, BigInt(id));
  }

  @Post(':id/dispatch')
  @ApiCreatedResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryTransfer' })
  async dispatch(@Req() req: any, @Param('id') id: string, @Body() dto: DispatchTransferDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.dispatch(tenantId, BigInt(id), dto);
  }

  @Post(':id/receive')
  @ApiCreatedResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryTransfer' })
  async receive(@Req() req: any, @Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.receive(tenantId, BigInt(id), dto);
  }

  @Post(':id/cancel')
  @ApiCreatedResponse({ type: InventoryTransferDto })
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryTransfer' })
  async cancel(@Req() req: any, @Param('id') id: string, @Body() dto: CancelTransferDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.cancel(tenantId, BigInt(id), dto);
  }
}
