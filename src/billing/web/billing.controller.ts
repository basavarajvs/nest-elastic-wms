import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { StorageRateService } from '../storage-rate.service';
import { BillingCycleService } from '../billing-cycle.service';
import { SnapshotService } from '../snapshot.service';
import { InvoiceService } from '../invoice.service';
import {
  CreateRateDto, CreateClientRateDto, CreateBillingCycleDto,
  GenerateSnapshotDto, CalculateChargesDto, GenerateInvoiceDto,
  UpdateInvoiceStatusDto, ListRatesDto, ListSnapshotsDto,
  ListChargesDto, ListInvoicesDto,
} from '../dtos/billing.dto';

@ApiTags('WMS-WEB', 'Billing')
@Controller('web/billing')
@UseGuards(CaslGuard)
export class BillingWebController {
  constructor(
    private readonly rateService: StorageRateService,
    private readonly cycleService: BillingCycleService,
    private readonly snapshotService: SnapshotService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('rates')
  @CheckAbility({ action: 'create', subject: 'StorageRateMaster' })
  @ApiOperation({ summary: 'Create a storage rate' })
  async createRate(@Body() dto: CreateRateDto, @Req() req: any) {
    return this.rateService.createRate(dto, req.tenantContext.getTenantId());
  }

  @Get('rates')
  @CheckAbility({ action: 'read', subject: 'StorageRateMaster' })
  @ApiOperation({ summary: 'List storage rates' })
  async listRates(@Req() req: any, @Query() filters: ListRatesDto) {
    return this.rateService.listRates(req.tenantContext.getTenantId(), filters);
  }

  @Post('client-rates')
  @CheckAbility({ action: 'create', subject: 'StorageClientRate' })
  @ApiOperation({ summary: 'Set a client-specific storage rate' })
  async setClientRate(@Body() dto: CreateClientRateDto, @Req() req: any) {
    return this.rateService.setClientRate(dto, req.tenantContext.getTenantId());
  }

  @Post('cycles')
  @CheckAbility({ action: 'create', subject: 'BillingCycle' })
  @ApiOperation({ summary: 'Create a billing cycle' })
  async createCycle(@Body() dto: CreateBillingCycleDto, @Req() req: any) {
    return this.cycleService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('cycles')
  @CheckAbility({ action: 'read', subject: 'BillingCycle' })
  @ApiOperation({ summary: 'List billing cycles' })
  async listCycles(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.cycleService.list(req.tenantContext.getTenantId(), { facilityId });
  }

  @Post('snapshots/generate')
  @CheckAbility({ action: 'create', subject: 'StorageInventorySnapshot' })
  @ApiOperation({ summary: 'Generate a daily inventory snapshot' })
  async generateSnapshot(@Body() dto: GenerateSnapshotDto, @Req() req: any) {
    return this.snapshotService.generateSnapshot(dto, req.tenantContext.getTenantId());
  }

  @Get('snapshots')
  @CheckAbility({ action: 'read', subject: 'StorageInventorySnapshot' })
  @ApiOperation({ summary: 'List inventory snapshots' })
  async listSnapshots(@Req() req: any, @Query() filters: ListSnapshotsDto) {
    return this.snapshotService.listSnapshots(req.tenantContext.getTenantId(), filters);
  }

  @Post('charges/calculate')
  @CheckAbility({ action: 'create', subject: 'StorageCharge' })
  @ApiOperation({ summary: 'Calculate charges from snapshots' })
  async calculateCharges(@Body() dto: CalculateChargesDto, @Req() req: any) {
    return this.snapshotService.calculateCharges(req.tenantContext.getTenantId(), dto);
  }

  @Get('charges')
  @CheckAbility({ action: 'read', subject: 'StorageCharge' })
  @ApiOperation({ summary: 'List storage charges' })
  async listCharges(@Req() req: any, @Query() filters: ListChargesDto) {
    return this.snapshotService.listCharges(req.tenantContext.getTenantId(), filters);
  }

  @Post('invoices/generate')
  @CheckAbility({ action: 'create', subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'Generate an invoice from charges' })
  async generateInvoice(@Body() dto: GenerateInvoiceDto, @Req() req: any) {
    return this.invoiceService.generateInvoice(dto, req.tenantContext.getTenantId());
  }

  @Get('invoices')
  @CheckAbility({ action: 'read', subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'List invoices' })
  async listInvoices(@Req() req: any, @Query() filters: ListInvoicesDto) {
    return this.invoiceService.listInvoices(req.tenantContext.getTenantId(), filters);
  }

  @Get('invoices/:id')
  @CheckAbility({ action: 'read', subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'Get invoice with lines' })
  async getInvoice(@Param('id') id: string, @Req() req: any) {
    return this.invoiceService.getInvoice(id, req.tenantContext.getTenantId());
  }

  @Patch('invoices/:id/status')
  @CheckAbility({ action: 'update', subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'Update invoice status' })
  async updateInvoiceStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto, @Req() req: any) {
    return this.invoiceService.updateStatus(id, dto, req.tenantContext.getTenantId());
  }
}
