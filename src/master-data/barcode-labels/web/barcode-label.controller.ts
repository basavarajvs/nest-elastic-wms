import { Controller, Delete, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { BarcodeLabelService } from '../barcode-label.service';

@ApiTags('Barcode Labels')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/barcode-labels')
export class BarcodeLabelController {
  constructor(private readonly barcodeLabelService: BarcodeLabelService) {}

  @Post('generate')
  @CheckAbility({ action: 'create', subject: 'Barcode' })
  @AuditLog({ eventType: 'BARCODE_LABEL_GENERATE', detail: (req, body) => `Generated label for ${body?.entityType}:${body?.entityId}` })
  @ApiOperation({ summary: 'Generate a barcode label' })
  async generate(@Req() req: any, @Body() dto: any) {
    return this.barcodeLabelService.generate(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Barcode' })
  @ApiOperation({ summary: 'List barcode labels' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.barcodeLabelService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Barcode' })
  @ApiOperation({ summary: 'Get barcode label' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.barcodeLabelService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Barcode' })
  @ApiOperation({ summary: 'Delete barcode label' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.barcodeLabelService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Post(':id/print')
  @CheckAbility({ action: 'update', subject: 'Barcode' })
  @AuditLog({ eventType: 'BARCODE_LABEL_PRINT', detail: (req, params) => `Print label ${params?.id}` })
  @ApiOperation({ summary: 'Mark barcode label as printed' })
  async print(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const labelId = BigInt(id);
    await this.barcodeLabelService.findById(tenantId, labelId);
    return this.barcodeLabelService.updatePrintStatus(tenantId, labelId, {
      printStatus: 'PRINTED',
      printedBy: req.rfSession?.userId || req.user?.sub,
    });
  }
}
