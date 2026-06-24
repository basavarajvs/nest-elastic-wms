import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { LpnTransactionService } from '../lpn-transaction.service';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Inventory')
@Controller('web')
@UseGuards(CaslGuard)
export class LpnTransactionsWebController {
  constructor(private readonly service: LpnTransactionService) {}

  @Get('lpn/:lpnId/transactions')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  @ApiOperation({ summary: 'Transaction history for an LPN' })
  async findByLpn(@Param('lpnId') lpnId: string, @Req() req: any) {
    return this.service.findByLpn(lpnId, req.tenantContext.getTenantId());
  }

  @Get('lpn-transactions')
  @CheckAbility({ action: 'read', subject: 'LPN' })
  @ApiOperation({ summary: 'List LPN transactions' })
  @ApiQuery({ name: 'lpnId', required: false })
  @ApiQuery({ name: 'transactionType', required: false })
  @ApiQuery({ name: 'facilityId', required: false })
  async findAll(
    @Req() req: any,
    @Query('lpnId') lpnId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), { lpnId, transactionType, facilityId });
  }
}
