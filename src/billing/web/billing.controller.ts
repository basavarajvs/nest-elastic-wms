import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageRateService } from '../storage/storage-rate.service';
import { ClientRateService } from '../storage/client-rate.service';
import { SnapshotService } from '../storage/snapshot.service';
import { ChargeService } from '../storage/charge.service';
import { InvoiceService } from '../invoicing/invoice.service';

@ApiTags('Billing')
@Controller('web/billing')
@UseGuards(JwtAuthGuard, CaslGuard)
export class BillingWebController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateService: StorageRateService,
    private readonly clientRateService: ClientRateService,
    private readonly snapshotService: SnapshotService,
    private readonly chargeService: ChargeService,
    private readonly invoiceService: InvoiceService,
  ) {}

  // ─── STORAGE RATES ──────────────────────────────────────────────────────

  @Post('storage-rates')
  @CheckAbility({ action: WmsAction.Create, subject: 'StorageRateMaster' })
  @AuditLog({ eventType: 'STORAGE_RATE_CREATE' })
  async createRate(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.createRateMaster(tenantId, dto);
  }

  @Get('storage-rates')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageRateMaster' })
  async findAllRates(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.findAllRateMasters(tenantId, query);
  }

  @Get('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'StorageRateMaster' })
  async findRateById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.findRateMasterById(tenantId, BigInt(id));
  }

  @Patch('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'StorageRateMaster' })
  @AuditLog({ eventType: 'STORAGE_RATE_UPDATE' })
  async updateRate(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.updateRateMaster(tenantId, BigInt(id), dto);
  }

  @Delete('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'StorageRateMaster' })
  @AuditLog({ eventType: 'STORAGE_RATE_DELETE' })
  @ApiOperation({ summary: 'Delete storage rate' })
  async deleteRate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.deleteRateMaster(tenantId, BigInt(id));
  }

  // ─── CLIENT RATES ───────────────────────────────────────────────────────

  @Post('client-rates')
  @CheckAbility({ action: WmsAction.Create, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_CREATE' })
  async createClientRate(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.create(tenantId, dto);
  }

  @Get('client-rates')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageClientRate' })
  async findAllClientRates(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.findAll(tenantId, query);
  }

  @Get('client-rates/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'StorageClientRate' })
  async findClientRateById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.findById(tenantId, id);
  }

  @Patch('client-rates/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_UPDATE' })
  async updateClientRate(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.update(tenantId, id, dto);
  }

  @Delete('client-rates/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_DELETE' })
  @ApiOperation({ summary: 'Delete client rate' })
  async deleteClientRate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.delete(tenantId, id);
  }

  // ─── BILLING CYCLES ─────────────────────────────────────────────────────

  @Post('cycles')
  @CheckAbility({ action: WmsAction.Create, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_CREATE' })
  async createCycle(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.billing_cycles.create({
      data: {
        tenant_id: tenantId,
        cycle_number: dto.cycleNumber,
        cycle_name: dto.cycleName || null,
        client_id: BigInt(dto.clientId),
        cycle_start_date: new Date(dto.cycleStartDate),
        cycle_end_date: new Date(dto.cycleEndDate),
        billing_frequency: dto.billingFrequency,
        status: dto.status || 'OPEN',
        currency_code: dto.currencyCode || 'USD',
      },
    });
  }

  @Get('cycles')
  @CheckAbility({ action: WmsAction.List, subject: 'BillingCycle' })
  async findAllCycles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenant_id: tenantId };
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const [data, total] = await Promise.all([
      this.prisma.billing_cycles.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { cycle_start_date: 'desc' } }),
      this.prisma.billing_cycles.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  @Patch('cycles/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_UPDATE' })
  async updateCycle(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const data: any = {};
    if (dto.cycleName !== undefined) data.cycle_name = dto.cycleName;
    if (dto.cycleStartDate !== undefined) data.cycle_start_date = new Date(dto.cycleStartDate);
    if (dto.cycleEndDate !== undefined) data.cycle_end_date = new Date(dto.cycleEndDate);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.currencyCode !== undefined) data.currency_code = dto.currencyCode;
    if (dto.totalStorageCharges !== undefined) data.total_storage_charges = dto.totalStorageCharges;
    if (dto.totalHandlingCharges !== undefined) data.total_handling_charges = dto.totalHandlingCharges;
    if (dto.totalVasCharges !== undefined) data.total_vas_charges = dto.totalVasCharges;
    if (dto.totalShippingCharges !== undefined) data.total_shipping_charges = dto.totalShippingCharges;
    if (dto.totalOtherCharges !== undefined) data.total_other_charges = dto.totalOtherCharges;
    if (dto.grandTotal !== undefined) data.grand_total = dto.grandTotal;
    data.updated_at = new Date();
    return this.prisma.billing_cycles.updateMany({
      where: { tenant_id: tenantId, billing_cycle_id: BigInt(id) },
      data,
    });
  }

  @Delete('cycles/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_DELETE' })
  @ApiOperation({ summary: 'Delete billing cycle' })
  async deleteCycle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.billing_cycles.deleteMany({
      where: { tenant_id: tenantId, billing_cycle_id: BigInt(id) },
    });
  }

  // ─── SNAPSHOTS ──────────────────────────────────────────────────────────

  @Get('snapshots')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageInventorySnapshot' })
  async findSnapshots(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.snapshotService.findSnapshots(tenantId, query);
  }

  @Post('snapshots/generate')
  @CheckAbility({ action: WmsAction.Create, subject: 'StorageInventorySnapshot' })
  @AuditLog({ eventType: 'SNAPSHOT_GENERATE' })
  async generateSnapshots(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.snapshotService.generateOnDemand(tenantId, BigInt(dto.facilityId));
  }

  // ─── CHARGES ────────────────────────────────────────────────────────────

  @Get('charges')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageCharge' })
  async findCharges(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.chargeService.findAll(tenantId, query);
  }

  // ─── INVOICES ───────────────────────────────────────────────────────────

  @Get('invoices')
  @CheckAbility({ action: WmsAction.List, subject: 'ClientInvoice' })
  async findAllInvoices(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.findAllInvoices(tenantId, query);
  }

  @Get('invoices/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ClientInvoice' })
  async findInvoiceById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.findInvoiceById(tenantId, BigInt(id));
  }

  @Post('invoices/:id/generate')
  @CheckAbility({ action: WmsAction.Create, subject: 'ClientInvoice' })
  @AuditLog({ eventType: 'INVOICE_GENERATE' })
  async generateInvoice(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.generateInvoice(
      tenantId,
      BigInt(dto.clientId),
      BigInt(id),
    );
  }

  @Delete('invoices/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ClientInvoice' })
  @AuditLog({ eventType: 'INVOICE_DELETE' })
  @ApiOperation({ summary: 'Delete invoice' })
  async deleteInvoice(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.delete(tenantId, BigInt(id));
  }
}
