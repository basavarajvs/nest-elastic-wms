import { Controller, Post, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ReceivingToleranceService } from '../receiving-tolerance.service';
import { ReceivingToleranceConfigResponseDto, ToleranceCheckResponseDto, CreateReceivingToleranceDto } from '../dtos/receiving-response.dto';

@ApiTags('Receiving Tolerance')
@Controller('web/receiving-tolerance')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReceivingToleranceWebController {
  constructor(private readonly receivingToleranceService: ReceivingToleranceService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update receiving tolerance config' })
  @ApiCreatedResponse({ type: ReceivingToleranceConfigResponseDto })
  @CheckAbility({ action: 'create', subject: 'ReceivingTolerance' })
  async upsert(@Req() req: any, @Body() dto: CreateReceivingToleranceDto) {
    return this.receivingToleranceService.upsert(this.getTenant(req), dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tolerance configs for a facility' })
  @ApiOkResponse({ type: [ReceivingToleranceConfigResponseDto] })
  @CheckAbility({ action: 'read', subject: 'ReceivingTolerance' })
  async findAll(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.receivingToleranceService.findAll(this.getTenant(req), BigInt(facilityId));
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if quantity is within tolerance' })
  @ApiOkResponse({ type: ToleranceCheckResponseDto })
  @CheckAbility({ action: 'read', subject: 'ReceivingTolerance' })
  async check(@Req() req: any, @Query() query: any) {
    return this.receivingToleranceService.isWithinTolerance(
      this.getTenant(req),
      BigInt(query.facilityId),
      Number(query.expectedQty),
      Number(query.actualQty),
      query.productId ? BigInt(query.productId) : undefined,
      query.vendorId ? BigInt(query.vendorId) : undefined,
    );
  }
}
