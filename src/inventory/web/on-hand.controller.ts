import { Controller, Get, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { OnHandService } from '../on-hand/on-hand.service';

@ApiTags('Inventory')
@Controller('web/inventory')
@UseGuards(JwtAuthGuard, CaslGuard)
export class OnHandWebController {
  constructor(private readonly service: OnHandService) {}

  @Get('on-hand')
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryOnHand' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get('on-hand/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'InventoryOnHand' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, id);
  }

  @Get('aging')
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryOnHand' })
  async getAgingReport(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getAgingReport(tenantId, query.facilityId);
  }

  @Get('aging/summary')
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryOnHand' })
  async getAgingSummary(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getAgingSummary(tenantId, query.facilityId);
  }

  @Delete('on-hand/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryOnHand' })
  @AuditLog({ eventType: 'ON_HAND_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
