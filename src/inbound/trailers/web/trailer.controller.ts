import { Controller, Post, Get, Patch, Param, Body, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { InboundTrailerService } from '../trailer.service';
import { TrailerDto, TrailerListResponseDto, DeleteResultDto, CheckInTrailerDto } from '../dtos/trailer-response.dto';

@ApiTags('Web - Inbound Trailers')
@Controller('web/inbound/trailers')
@UseGuards(JwtAuthGuard, CaslGuard)
export class InboundTrailerWebController {
  constructor(private readonly trailerService: InboundTrailerService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Check in a trailer on arrival' })
  @ApiCreatedResponse({ type: TrailerDto })
  @CheckAbility({ action: 'create', subject: 'Trailer' })
  async checkIn(@Req() req: any, @Body() dto: CheckInTrailerDto) {
    const tenantId = this.getTenant(req);
    const facilityId = BigInt(dto.facility_id);
    return this.trailerService.checkIn(tenantId, facilityId, dto);
  }

  @Post(':id/assign-dock')
  @ApiOperation({ summary: 'Assign trailer to dock door' })
  @ApiOkResponse({ type: TrailerDto })
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async assignDock(@Req() req: any, @Param('id') id: string, @Body('dockCode') dockCode: string) {
    const tenantId = this.getTenant(req);
    const facilityId = BigInt(id);
    return this.trailerService.assignDock(tenantId, BigInt(id), BigInt(id), dockCode);
  }

  @Get()
  @ApiOperation({ summary: 'List inbound trailers' })
  @ApiOkResponse({ type: TrailerListResponseDto })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.trailerService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trailer by ID' })
  @ApiOkResponse({ type: TrailerDto })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.findById(this.getTenant(req), BigInt(id));
  }

  @Get('by-number/:number')
  @ApiOperation({ summary: 'Find trailer by number' })
  @ApiOkResponse({ type: TrailerDto })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findByNumber(@Req() req: any, @Query('facilityId') facilityId: string, @Param('number') number: string) {
    return this.trailerService.findByNumber(this.getTenant(req), BigInt(facilityId), number);
  }

  @Post(':id/depart')
  @ApiOperation({ summary: 'Depart trailer from facility' })
  @ApiOkResponse({ type: TrailerDto })
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async depart(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.depart(this.getTenant(req), BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trailer record' })
  @ApiOkResponse({ type: DeleteResultDto })
  @CheckAbility({ action: 'delete', subject: 'Trailer' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.delete(this.getTenant(req), BigInt(id));
  }
}
