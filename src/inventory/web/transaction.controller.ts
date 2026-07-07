import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { TransactionService } from '../transactions/transaction.service';
import { InventoryTransactionResponseDto, PaginatedInventoryTransactionResponseDto, CreateInventoryTransactionDto } from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/inventory-transactions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class TransactionWebController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryTransaction' })
  @ApiOkResponse({ type: PaginatedInventoryTransactionResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryTransaction' })
  @ApiOkResponse({ type: InventoryTransactionResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Post()
  @CheckAbility({ action: WmsAction.Transact, subject: 'InventoryTransaction' })
  @AuditLog({ eventType: 'TRANSACTION_EXECUTE', detail: (req, body) => `Executed ${body.transaction_type} transaction` })
  @ApiCreatedResponse({ type: InventoryTransactionResponseDto })
  async execute(@Req() req: any, @Body() dto: CreateInventoryTransactionDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.executeTransaction(tenantId, { ...dto, userId });
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryTransaction' })
  @AuditLog({ eventType: 'TRANSACTION_DELETE' })
  @ApiOkResponse({ type: InventoryTransactionResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
