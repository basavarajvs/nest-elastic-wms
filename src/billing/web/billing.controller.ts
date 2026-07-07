import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
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
import { DeleteResultDto } from '../../common/dto/paginated-response.dto';
import {
  StorageRateMasterDto,
  StorageClientRateDto,
  BillingCycleDto,
  BillingCyclesResponseDto,
  StorageSnapshotDto,
  SnapshotsResponseDto,
  SnapshotGenerateResultDto,
  StorageChargeDto,
  ChargesResponseDto,
  ClientInvoiceDto,
  InvoicesResponseDto,
  CreateStorageRateDto,
  UpdateStorageRateDto,
  CreateClientRateDto,
  UpdateClientRateDto,
  CreateBillingCycleDto,
  UpdateBillingCycleDto,
  GenerateSnapshotDto,
  GenerateInvoiceDto,
} from '../dto/billing-response.dto';

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
  @ApiOperation({ summary: 'Create storage rate' })
  @ApiCreatedResponse({ type: StorageRateMasterDto })
  async createRate(@Req() req: any, @Body() dto: CreateStorageRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.createRateMaster(tenantId, dto);
  }

  @Get('storage-rates')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageRateMaster' })
  @ApiOperation({ summary: 'List storage rates' })
  @ApiOkResponse({ type: [StorageRateMasterDto] })
  async findAllRates(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.findAllRateMasters(tenantId, query);
  }

  @Get('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'StorageRateMaster' })
  @ApiOperation({ summary: 'Get storage rate by ID' })
  @ApiOkResponse({ type: StorageRateMasterDto })
  async findRateById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.findRateMasterById(tenantId, BigInt(id));
  }

  @Patch('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'StorageRateMaster' })
  @AuditLog({ eventType: 'STORAGE_RATE_UPDATE' })
  @ApiOperation({ summary: 'Update storage rate' })
  @ApiOkResponse({ type: StorageRateMasterDto })
  async updateRate(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStorageRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.updateRateMaster(tenantId, BigInt(id), dto);
  }

  @Delete('storage-rates/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'StorageRateMaster' })
  @AuditLog({ eventType: 'STORAGE_RATE_DELETE' })
  @ApiOperation({ summary: 'Delete storage rate' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteRate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rateService.deleteRateMaster(tenantId, BigInt(id));
  }

  // ─── CLIENT RATES ───────────────────────────────────────────────────────

  @Post('client-rates')
  @CheckAbility({ action: WmsAction.Create, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_CREATE' })
  @ApiOperation({ summary: 'Create client rate' })
  @ApiCreatedResponse({ type: StorageClientRateDto })
  async createClientRate(@Req() req: any, @Body() dto: CreateClientRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.create(tenantId, dto);
  }

  @Get('client-rates')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageClientRate' })
  @ApiOperation({ summary: 'List client rates' })
  @ApiOkResponse({ type: [StorageClientRateDto] })
  async findAllClientRates(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.findAll(tenantId, query);
  }

  @Get('client-rates/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'StorageClientRate' })
  @ApiOperation({ summary: 'Get client rate by ID' })
  @ApiOkResponse({ type: StorageClientRateDto })
  async findClientRateById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.findById(tenantId, id);
  }

  @Patch('client-rates/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_UPDATE' })
  @ApiOperation({ summary: 'Update client rate' })
  @ApiOkResponse({ type: StorageClientRateDto })
  async updateClientRate(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientRateDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientRateService.update(tenantId, id, dto);
  }

  @Delete('client-rates/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'StorageClientRate' })
  @AuditLog({ eventType: 'CLIENT_RATE_DELETE' })
  @ApiOperation({ summary: 'Delete client rate' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteClientRate(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const count = await this.clientRateService.delete(tenantId, id);
    return { count };
  }

  // ─── BILLING CYCLES ─────────────────────────────────────────────────────

  @Post('cycles')
  @CheckAbility({ action: WmsAction.Create, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_CREATE' })
  @ApiOperation({ summary: 'Create billing cycle' })
  @ApiCreatedResponse({ type: BillingCycleDto })
  async createCycle(@Req() req: any, @Body() dto: CreateBillingCycleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.billing_cycles.create({
      data: {
        tenant_id: tenantId,
        cycle_number: dto.cycle_number,
        cycle_name: dto.cycle_name || null,
        client_id: BigInt(dto.client_id),
        cycle_start_date: new Date(dto.cycle_start_date),
        cycle_end_date: new Date(dto.cycle_end_date),
        billing_frequency: dto.billing_frequency,
        status: dto.status || 'OPEN',
        currency_code: dto.currency_code || 'USD',
      },
    });
  }

  @Get('cycles')
  @CheckAbility({ action: WmsAction.List, subject: 'BillingCycle' })
  @ApiOperation({ summary: 'List billing cycles' })
  @ApiOkResponse({ type: BillingCyclesResponseDto })
  async findAllCycles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenant_id: tenantId };
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const [data, total] = await Promise.all([
      this.prisma.billing_cycles.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { cycle_start_date: 'desc' }, include: { clients: true } }),
      this.prisma.billing_cycles.count({ where }),
    ]);
    return {
      data: data.map((d: any) => ({ ...d, client_name: d.clients?.client_name ?? null })),
      total, page, limit,
    };
  }

  @Patch('cycles/:id')
  @CheckAbility({ action: WmsAction.Update, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_UPDATE' })
  @ApiOperation({ summary: 'Update billing cycle' })
  @ApiOkResponse({ type: BillingCycleDto })
  async updateCycle(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBillingCycleDto) {
    const tenantId = req.tenantContext.getTenantId();
    const data: any = {};
    if (dto.cycle_name !== undefined) data.cycle_name = dto.cycle_name;
    if (dto.cycle_start_date !== undefined) data.cycle_start_date = new Date(dto.cycle_start_date);
    if (dto.cycle_end_date !== undefined) data.cycle_end_date = new Date(dto.cycle_end_date);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.currency_code !== undefined) data.currency_code = dto.currency_code;
    if (dto.total_storage_charges !== undefined) data.total_storage_charges = dto.total_storage_charges;
    if (dto.total_handling_charges !== undefined) data.total_handling_charges = dto.total_handling_charges;
    if (dto.total_vas_charges !== undefined) data.total_vas_charges = dto.total_vas_charges;
    if (dto.total_shipping_charges !== undefined) data.total_shipping_charges = dto.total_shipping_charges;
    if (dto.total_other_charges !== undefined) data.total_other_charges = dto.total_other_charges;
    if (dto.grand_total !== undefined) data.grand_total = dto.grand_total;
    data.updated_at = new Date();
    await this.prisma.billing_cycles.updateMany({
      where: { tenant_id: tenantId, billing_cycle_id: BigInt(id) },
      data,
    });
    return this.prisma.billing_cycles.findFirst({
      where: { tenant_id: tenantId, billing_cycle_id: BigInt(id) },
    });
  }

  @Delete('cycles/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'BillingCycle' })
  @AuditLog({ eventType: 'BILLING_CYCLE_DELETE' })
  @ApiOperation({ summary: 'Delete billing cycle' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteCycle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.billing_cycles.deleteMany({
      where: { tenant_id: tenantId, billing_cycle_id: BigInt(id) },
    });
  }

  // ─── SNAPSHOTS ──────────────────────────────────────────────────────────

  @Get('snapshots')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageInventorySnapshot' })
  @ApiOperation({ summary: 'List storage inventory snapshots' })
  @ApiOkResponse({ type: SnapshotsResponseDto })
  async findSnapshots(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.snapshotService.findSnapshots(tenantId, query);
  }

  @Post('snapshots/generate')
  @CheckAbility({ action: WmsAction.Create, subject: 'StorageInventorySnapshot' })
  @AuditLog({ eventType: 'SNAPSHOT_GENERATE' })
  @ApiOperation({ summary: 'Generate inventory snapshots on demand' })
  @ApiCreatedResponse({ type: SnapshotGenerateResultDto })
  async generateSnapshots(@Req() req: any, @Body() dto: GenerateSnapshotDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.snapshotService.generateOnDemand(tenantId, BigInt(dto.facility_id));
  }

  // ─── CHARGES ────────────────────────────────────────────────────────────

  @Get('charges')
  @CheckAbility({ action: WmsAction.List, subject: 'StorageCharge' })
  @ApiOperation({ summary: 'List storage charges' })
  @ApiOkResponse({ type: ChargesResponseDto })
  async findCharges(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.chargeService.findAll(tenantId, query);
  }

  // ─── INVOICES ───────────────────────────────────────────────────────────

  @Get('invoices')
  @CheckAbility({ action: WmsAction.List, subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'List invoices' })
  @ApiOkResponse({ type: InvoicesResponseDto })
  async findAllInvoices(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.findAllInvoices(tenantId, query);
  }

  @Get('invoices/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ClientInvoice' })
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiOkResponse({ type: ClientInvoiceDto })
  async findInvoiceById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.findInvoiceById(tenantId, BigInt(id));
  }

  @Post('invoices/:id/generate')
  @CheckAbility({ action: WmsAction.Create, subject: 'ClientInvoice' })
  @AuditLog({ eventType: 'INVOICE_GENERATE' })
  @ApiOperation({ summary: 'Generate invoice from billing cycle' })
  @ApiCreatedResponse({ type: ClientInvoiceDto })
  async generateInvoice(@Req() req: any, @Param('id') id: string, @Body() dto: GenerateInvoiceDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.generateInvoice(
      tenantId,
      BigInt(dto.client_id),
      BigInt(id),
    );
  }

  @Delete('invoices/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ClientInvoice' })
  @AuditLog({ eventType: 'INVOICE_DELETE' })
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteInvoice(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.invoiceService.delete(tenantId, BigInt(id));
  }
}

