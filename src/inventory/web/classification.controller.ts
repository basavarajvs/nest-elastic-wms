import { Controller, Get, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ClassificationService } from '../classifications/classification.service';

@ApiTags('Inventory')
@Controller('web/inventory/abc-classification')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ClassificationWebController {
  constructor(private readonly service: ClassificationService) {}

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'InventoryPolicy' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.getAbcClassifications(tenantId, query.facilityId);
  }

  @Patch(':productId')
  @CheckAbility({ action: WmsAction.Update, subject: 'InventoryPolicy' })
  @AuditLog({ eventType: 'ABC_CLASSIFICATION_UPDATE' })
  async update(@Req() req: any, @Param('productId') productId: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.service.updateAbcClassification(tenantId, productId, dto.abcClass, userId);
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'InventoryPolicy' })
  @AuditLog({ eventType: 'ABC_CLASSIFICATION_DELETE' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
