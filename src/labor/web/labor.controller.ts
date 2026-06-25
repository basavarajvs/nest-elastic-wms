import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { ShiftService } from '../shift.service';
import { TimeTrackingService } from '../time-tracking.service';
import { PerformanceService } from '../performance.service';
import {
  CreateShiftDto, UpdateShiftDto, AssignShiftDto,
  ClockInDto, ClockOutDto, ListTimeLogsDto, ListPerformanceDto,
} from '../dtos/labor.dto';

@ApiTags('WMS-WEB', 'Labor')
@Controller('web/labor')
@UseGuards(CaslGuard)
export class LaborWebController {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly timeTrackingService: TimeTrackingService,
    private readonly performanceService: PerformanceService,
  ) {}

  @Post('shifts')
  @CheckAbility({ action: 'create', subject: 'LaborShift' })
  @ApiOperation({ summary: 'Create a labor shift' })
  async createShift(@Body() dto: CreateShiftDto, @Req() req: any) {
    return this.shiftService.createShift(dto, req.tenantContext.getTenantId());
  }

  @Get('shifts')
  @CheckAbility({ action: 'read', subject: 'LaborShift' })
  @ApiOperation({ summary: 'List labor shifts' })
  async listShifts(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.shiftService.listShifts(req.tenantContext.getTenantId(), { facilityId });
  }

  @Patch('shifts/:id')
  @CheckAbility({ action: 'update', subject: 'LaborShift' })
  @ApiOperation({ summary: 'Update a labor shift' })
  async updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto, @Req() req: any) {
    return this.shiftService.updateShift(id, dto, req.tenantContext.getTenantId());
  }

  @Post('assignments')
  @CheckAbility({ action: 'create', subject: 'LaborShiftAssignment' })
  @ApiOperation({ summary: 'Assign user to shift' })
  async assignShift(@Body() dto: AssignShiftDto, @Req() req: any) {
    return this.shiftService.assignShift(dto, req.tenantContext.getTenantId());
  }

  @Get('assignments')
  @CheckAbility({ action: 'read', subject: 'LaborShiftAssignment' })
  @ApiOperation({ summary: 'List shift assignments' })
  async listAssignments(@Req() req: any, @Query('userId') userId: string, @Query('shiftId') shiftId: string) {
    return this.shiftService.listAssignments(req.tenantContext.getTenantId(), { userId, shiftId });
  }

  @Post('time-logs/clock-in')
  @CheckAbility({ action: 'create', subject: 'LaborTimeLog' })
  @ApiOperation({ summary: 'Clock in' })
  async clockIn(@Body() dto: ClockInDto, @Req() req: any) {
    return this.timeTrackingService.clockIn(dto, req.user?.id || req.tenantContext.getUserId(), req.tenantContext.getTenantId());
  }

  @Post('time-logs/clock-out')
  @CheckAbility({ action: 'update', subject: 'LaborTimeLog' })
  @ApiOperation({ summary: 'Clock out' })
  async clockOut(@Body() dto: ClockOutDto, @Req() req: any) {
    return this.timeTrackingService.clockOut(dto, req.user?.id || req.tenantContext.getUserId(), req.tenantContext.getTenantId());
  }

  @Get('time-logs')
  @CheckAbility({ action: 'read', subject: 'LaborTimeLog' })
  @ApiOperation({ summary: 'List time logs' })
  async listTimeLogs(@Req() req: any, @Query() filters: ListTimeLogsDto) {
    return this.timeTrackingService.listTimeLogs(req.tenantContext.getTenantId(), filters);
  }

  @Get('performance')
  @CheckAbility({ action: 'read', subject: 'LaborPerformanceMetric' })
  @ApiOperation({ summary: 'List performance metrics' })
  async listPerformance(@Req() req: any, @Query() filters: ListPerformanceDto) {
    return this.performanceService.listMetrics(req.tenantContext.getTenantId(), filters);
  }
}
