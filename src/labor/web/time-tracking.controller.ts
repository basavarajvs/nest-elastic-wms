import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { TimeLogResponseDto } from '../dtos/time-log-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { TimeTrackingService } from '../time-tracking/time-tracking.service';

@ApiTags('Labor Time Tracking')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/labor/time-logs')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'Labor' })
  @ApiOperation({ summary: 'List time logs' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.timeTrackingService.findAll(tenantId, query);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Labor' })
  @ApiOperation({ summary: 'Delete time log' })
  @ApiOkResponse({ type: TimeLogResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.timeTrackingService.delete(tenantId, BigInt(id));
  }
}
