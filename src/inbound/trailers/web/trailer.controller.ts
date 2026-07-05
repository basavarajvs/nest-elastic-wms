import { Controller, Post, Get, Patch, Param, Body, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { InboundTrailerService } from '../trailer.service';

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
  @CheckAbility({ action: 'create', subject: 'Trailer' })
  async checkIn(@Req() req: any, @Body() dto: any) {
    const tenantId = this.getTenant(req);
    const facilityId = BigInt(dto.facilityId);
    return this.trailerService.checkIn(tenantId, facilityId, dto);
  }

  @Post(':id/assign-dock')
  @ApiOperation({ summary: 'Assign trailer to dock door' })
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async assignDock(@Req() req: any, @Param('id') id: string, @Body('dockCode') dockCode: string) {
    const tenantId = this.getTenant(req);
    const facilityId = BigInt(id);
    return this.trailerService.assignDock(tenantId, BigInt(id), BigInt(id), dockCode);
  }

  @Get()
  @ApiOperation({ summary: 'List inbound trailers' })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.trailerService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trailer by ID' })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.findById(this.getTenant(req), BigInt(id));
  }

  @Get('by-number/:number')
  @ApiOperation({ summary: 'Find trailer by number' })
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findByNumber(@Req() req: any, @Query('facilityId') facilityId: string, @Param('number') number: string) {
    return this.trailerService.findByNumber(this.getTenant(req), BigInt(facilityId), number);
  }

  @Post(':id/depart')
  @ApiOperation({ summary: 'Depart trailer from facility' })
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async depart(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.depart(this.getTenant(req), BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trailer record' })
  @CheckAbility({ action: 'delete', subject: 'Trailer' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.delete(this.getTenant(req), BigInt(id));
  }
}
