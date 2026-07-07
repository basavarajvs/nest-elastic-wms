import { Controller, Get, Post, Patch, Param, Body, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { RootCauseService } from '../counts/root-cause.service';
import { CycleCountService } from '../counts/cycle-count.service';
import { CountSchedulerService } from '../counts/count-scheduler.service';
import {
  CycleCountResponseDto,
  CycleCountLineResponseDto,
  VarianceInvestigationResponseDto,
  CompareRecountResponseDto,
  CycleCountEventResponseDto,
  CountProgressResponseDto,
  RootCauseCategoryResponseDto,
  CountSchedulerMetricsResponseDto,
  SchedulerGenerateResponseDto,
  ReclassifyAbcResponseDto,
  RejectVarianceDto,
  CompareRecountDto,
  GetNextCountWorkDto,
  SaveDraftLineDto,
  CreateRootCauseCategoryDto,
  AssignRootCauseDto,
  GenerateScheduledCountsDto,
  ReclassifyAbcDto,
  CreateCycleCountDto,
} from '../dtos/inventory-response.dto';

@ApiTags('Inventory')
@Controller('web/cycle-counts')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CycleCountWebSupervisorController {
  constructor(
    private readonly rootCauseService: RootCauseService,
    private readonly cycleCountService: CycleCountService,
  ) {}

  // GAP-4.3: Web supervisor review endpoints
  @Get('pending-reviews')
  @CheckAbility({ action: WmsAction.List, subject: 'CycleCount' })
  @ApiOkResponse({ type: [VarianceInvestigationResponseDto] })
  async pendingReviews(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.query?.facilityId || 0);
    return this.cycleCountService.getPendingReviews(tenantId, facilityId);
  }

  @Post(':id/approve')
  @CheckAbility({ action: WmsAction.Approve, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async approve(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.cycleCountService.approveVariance(tenantId, BigInt(id), userId);
  }

  @Post(':id/reject')
  @CheckAbility({ action: WmsAction.Approve, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: RejectVarianceDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.cycleCountService.rejectVariance(tenantId, BigInt(id), userId, dto?.reason || 'Rejected by supervisor');
  }

  @Post(':id/recount')
  @CheckAbility({ action: WmsAction.Update, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async recount(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.cycleCountService.requestRecount(tenantId, BigInt(id), userId);
  }

  // GAP-3.3: Recount comparison
  @Post(':id/compare-recount')
  @CheckAbility({ action: WmsAction.Read, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: CompareRecountResponseDto })
  async compareRecount(@Req() req: any, @Param('id') id: string, @Body() dto: CompareRecountDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.cycleCountService.compareRecount(tenantId, id, dto.recount_count_id);
  }

  // APP-CC-E: Audit timeline
  @Get(':id/timeline')
  @CheckAbility({ action: WmsAction.Read, subject: 'CycleCount' })
  @ApiOkResponse({ type: [CycleCountEventResponseDto] })
  async timeline(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.cycleCountService.getAuditTimeline(tenantId, id);
  }

  // APP-CC-F: getNextCountWork
  @Post('next-count-work')
  @CheckAbility({ action: WmsAction.ExecuteCycleCount, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async nextCountWork(@Req() req: any, @Body() dto: GetNextCountWorkDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    const facilityId = BigInt(dto.facility_id || 0);
    return this.cycleCountService.getNextCountWork(tenantId, facilityId, userId);
  }

  // APP-CC-K: Ad-hoc count creation
  @Post('create-ad-hoc')
  @CheckAbility({ action: WmsAction.ExecuteCycleCount, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: CycleCountResponseDto })
  async createAdHoc(@Req() req: any, @Body() dto: CreateCycleCountDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.cycleCountService.createAdHoc(tenantId, dto);
  }

  // APP-CC-G: Save draft line
  @Post(':id/save-draft-line')
  @CheckAbility({ action: WmsAction.Count, subject: 'CycleCountLine' })
  @ApiCreatedResponse({ type: CycleCountLineResponseDto })
  async saveDraftLine(@Req() req: any, @Param('id') id: string, @Body() dto: SaveDraftLineDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.cycleCountService.saveDraftLine(tenantId, id, dto);
  }

  // APP-CC-G: Get count progress
  @Get(':id/progress')
  @CheckAbility({ action: WmsAction.Read, subject: 'CycleCount' })
  @ApiOkResponse({ type: CountProgressResponseDto })
  async getProgress(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.cycleCountService.getCountProgress(tenantId, id);
  }
}

// GAP-5.3: Web root cause category CRUD
@ApiTags('Inventory')
@Controller('web/root-cause-categories')
@UseGuards(JwtAuthGuard, CaslGuard)
export class RootCauseWebController {
  constructor(private readonly rootCauseService: RootCauseService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: RootCauseCategoryResponseDto })
  async create(@Req() req: any, @Body() dto: CreateRootCauseCategoryDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rootCauseService.createCategory(tenantId, dto);
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'CycleCount' })
  @ApiOkResponse({ type: [RootCauseCategoryResponseDto] })
  async findAll(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rootCauseService.findAllCategories(tenantId);
  }

  @Post(':categoryId/assign')
  @CheckAbility({ action: WmsAction.Update, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: VarianceInvestigationResponseDto })
  async assign(@Req() req: any, @Param('categoryId') categoryId: string, @Body() dto: AssignRootCauseDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.rootCauseService.assignRootCause(tenantId, BigInt(dto.investigation_id), BigInt(categoryId), dto.description);
  }
}

// GAP-6.2: Web count scheduler endpoints
@ApiTags('Inventory')
@Controller('web/count-scheduler')
@UseGuards(JwtAuthGuard, CaslGuard)
export class CountSchedulerWebController {
  constructor(private readonly schedulerService: CountSchedulerService) {}

  @Post('generate')
  @CheckAbility({ action: WmsAction.ManageCycleCountSchedule, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: SchedulerGenerateResponseDto })
  async generate(@Req() req: any, @Body() dto: GenerateScheduledCountsDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.schedulerService.generateScheduledCounts(tenantId, BigInt(dto.facility_id));
  }

  @Post('reclassify-abc')
  @CheckAbility({ action: WmsAction.ManageCycleCountSchedule, subject: 'CycleCount' })
  @ApiCreatedResponse({ type: ReclassifyAbcResponseDto })
  async reclassify(@Req() req: any, @Body() dto: ReclassifyAbcDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.schedulerService.reclassifyABC(tenantId, BigInt(dto.facility_id));
  }

  @Get('metrics')
  @CheckAbility({ action: WmsAction.Read, subject: 'CycleCount' })
  @ApiOkResponse({ type: [CountSchedulerMetricsResponseDto] })
  async metrics(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.query?.facilityId || 0);
    return this.schedulerService.getSchedulerMetrics(tenantId, facilityId);
  }
}
