import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AsnService } from '../asn.service';
import { GrnService } from '../grn.service';
import { PutawayService } from '../putaway.service';
import { QcService } from '../qc.service';
import { CreateAsnDto, UpdateAsnStatusDto, AsnFilterDto } from '../dtos/asn.dto';
import { CreateGrnFromAsnDto, CreateGrnAdHocDto, MarkGrnArrivedDto, CompleteInspectionDto, GrnFilterDto } from '../dtos/grn.dto';
import { QcInspectDto, QcDispositionDto } from '../dtos/qc.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/inbound')
@UseGuards(CaslGuard)
export class InboundWebController {
  constructor(
    private readonly asnService: AsnService,
    private readonly grnService: GrnService,
    private readonly putawayService: PutawayService,
    private readonly qcService: QcService,
  ) {}

  @Post('/asn')
  @CheckAbility({ action: 'create', subject: 'AdvanceShipNotice' })
  async createAsn(@Req() req: any, @Body() dto: CreateAsnDto) {
    return this.asnService.create(dto, req.tenantContext.getTenantId());
  }

  @Get('/asn/:id/preview')
  @CheckAbility({ action: 'read', subject: 'AdvanceShipNotice' })
  async previewAsn(@Req() req: any, @Param('id') id: string) {
    return this.asnService.previewReceive(id, req.tenantContext.getTenantId());
  }

  @Patch('/asn/:id/status')
  @CheckAbility({ action: 'update', subject: 'AdvanceShipNotice' })
  async updateAsnStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAsnStatusDto) {
    return this.asnService.updateStatus(id, dto.status, req.tenantContext.getTenantId());
  }

  @Get('/asn')
  @CheckAbility({ action: 'list', subject: 'AdvanceShipNotice' })
  async listAsns(@Req() req: any, @Query() filter: AsnFilterDto) {
    return this.asnService.list(req.tenantContext.getTenantId(), filter);
  }

  @Post('/grn/from-asn')
  @CheckAbility({ action: 'create', subject: 'GoodsReceipt' })
  async createGrnFromAsn(@Req() req: any, @Body() dto: CreateGrnFromAsnDto) {
    return this.grnService.createFromAsn(dto.asnNumber, req.tenantContext.getTenantId());
  }

  @Post('/grn/ad-hoc')
  @CheckAbility({ action: 'create', subject: 'GoodsReceipt' })
  async createGrnAdHoc(@Req() req: any, @Body() dto: CreateGrnAdHocDto) {
    return this.grnService.createAdHoc(dto, req.tenantContext.getTenantId());
  }

  @Get('/grn')
  @CheckAbility({ action: 'list', subject: 'GoodsReceipt' })
  async listGrns(@Req() req: any, @Query() filter: GrnFilterDto) {
    return this.grnService.list(req.tenantContext.getTenantId(), filter);
  }

  @Get('/grn/:id')
  @CheckAbility({ action: 'read', subject: 'GoodsReceipt' })
  async getGrnProgress(@Req() req: any, @Param('id') id: string) {
    return this.grnService.getProgress(id, req.tenantContext.getTenantId());
  }

  @Post('/qc/inspect')
  @CheckAbility({ action: 'update', subject: 'Inspection' })
  async inspectQc(@Req() req: any, @Body() dto: QcInspectDto) {
    return this.qcService.inspect(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Get('/putaway/board')
  @CheckAbility({ action: 'read', subject: 'PutawayTask' })
  async getPutawayBoard(
    @Req() req: any,
    @Query('status') status: string,
    @Query('assignedToUserId') assignedToUserId: string,
    @Query('priority') priority: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.putawayService.getTaskBoard(req.tenantContext.getTenantId(), {
      status, assignedToUserId, priority, page, limit,
    });
  }

  @Post('/disposition/apply')
  @CheckAbility({ action: 'approve', subject: 'QcDisposition' })
  async applyDisposition(@Req() req: any, @Body() dto: QcDispositionDto) {
    return this.qcService.applyDisposition(dto, req.tenantContext.getTenantId(), req.user?.userId);
  }

  // ── GRN Lifecycle ──
  @Post('/grn/:id/mark-arrived')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async markArrived(@Req() req: any, @Param('id') id: string, @Body() dto: MarkGrnArrivedDto) {
    return this.grnService.markArrived(id, req.tenantContext.getTenantId(), dto.notes);
  }

  @Post('/grn/:id/start-receiving')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async startReceiving(@Req() req: any, @Param('id') id: string) {
    return this.grnService.startReceiving(id, req.tenantContext.getTenantId(), req.user?.userId);
  }

  @Post('/grn/:id/mark-received')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async markReceived(@Req() req: any, @Param('id') id: string) {
    return this.grnService.markReceived(id, req.tenantContext.getTenantId());
  }

  @Post('/grn/:id/start-inspection')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async startInspection(@Req() req: any, @Param('id') id: string) {
    return this.grnService.startInspection(id, req.tenantContext.getTenantId());
  }

  @Post('/grn/:id/complete-inspection')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async completeInspection(@Req() req: any, @Param('id') id: string, @Body() dto: CompleteInspectionDto) {
    return this.grnService.completeInspection(id, dto.result, req.tenantContext.getTenantId(), dto.notes);
  }

  @Post('/grn/:id/cancel')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async cancelGrn(@Req() req: any, @Param('id') id: string) {
    return this.grnService.cancel(id, req.tenantContext.getTenantId());
  }

  @Post('/grn/:id/mark-partial')
  @CheckAbility({ action: 'update', subject: 'GoodsReceipt' })
  async markPartial(@Req() req: any, @Param('id') id: string) {
    return this.grnService.markPartial(id, req.tenantContext.getTenantId());
  }

  @Get('/grn/:id/valid-next-statuses')
  @CheckAbility({ action: 'read', subject: 'GoodsReceipt' })
  async getValidNextStatuses(@Req() req: any, @Param('id') id: string) {
    return this.grnService.getValidNextStatuses(id, req.tenantContext.getTenantId());
  }
}
