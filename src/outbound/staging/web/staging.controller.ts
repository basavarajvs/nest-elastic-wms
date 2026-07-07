import { Controller, Post, Get, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { StagingService } from '../staging.service';
import { StagingLaneDto, LaneContentsDto, CreateStagingLaneDto } from '../dtos/response.dto';

@ApiTags('Outbound - Staging')
@Controller('web/staging')
@UseGuards(JwtAuthGuard, CaslGuard)
export class StagingWebController {
  constructor(private readonly stagingService: StagingService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  private getFacility(req: any): bigint {
    return req.tenantContext.getFacilityId
      ? BigInt(req.tenantContext.getFacilityId())
      : BigInt(req.body.facilityId);
  }

  @Get('lanes')
  @CheckAbility({ action: 'read', subject: 'StagingLane' })
  @ApiOkResponse({ type: [StagingLaneDto] })
  async findAllLanes(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.stagingService.findAllLanes(this.getTenant(req), BigInt(facilityId));
  }

  @Post('lanes')
  @CheckAbility({ action: 'create', subject: 'StagingLane' })
  @ApiCreatedResponse({ type: StagingLaneDto })
  async createLane(@Req() req: any, @Body() dto: CreateStagingLaneDto) {
    return this.stagingService.createLane(this.getTenant(req), dto);
  }

  @Get('lanes/:id/contents')
  @CheckAbility({ action: 'read', subject: 'StagingLane' })
  @ApiOkResponse({ type: LaneContentsDto })
  async getLaneContents(@Req() req: any, @Param('id') id: string, @Query('facilityId') facilityId: string) {
    return this.stagingService.getLaneContents(this.getTenant(req), BigInt(facilityId), BigInt(id));
  }
}
