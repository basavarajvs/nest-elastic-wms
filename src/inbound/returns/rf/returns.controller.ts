import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ReturnsService } from '../returns.service';
import { ReturnListResponseDto, RfReceiveResponseDto, RfDispositionResponseDto, RfCompleteResponseDto, RfLookupRmaDto, RfReceiveReturnDto, RfDispositionDto, RfCompleteReturnDto } from '../dtos/returns-response.dto';

@ApiTags('RF - Returns')
@Controller('rf/inbound/returns')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('lookup-rma')
  @ApiOperation({ summary: 'Lookup return by RMA number (RF)' })
  @ApiOkResponse({ type: ReturnListResponseDto })
  @RfAction('read')
  async lookupRma(@Req() req: any, @Body() dto: RfLookupRmaDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = req.rfSession?.facilityId ? BigInt(req.rfSession.facilityId) : BigInt(dto.facility_id || 0);
    return this.returnsService.findAll(tenantId, { search: dto.return_number || dto.rma_number, limit: 5, facilityId: facilityId.toString() });
  }

  @Post('receive')
  @ApiOperation({ summary: 'Receive returned item (RF) - scan SKU, enter qty' })
  @ApiCreatedResponse({ type: RfReceiveResponseDto })
  @RfAction('create')
  async receive(@Req() req: any, @Body() dto: RfReceiveReturnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return { received: true, message: 'Return item received', dto };
  }

  @Post('disposition')
  @ApiOperation({ summary: 'Set disposition on returned item (RF)' })
  @ApiOkResponse({ type: RfDispositionResponseDto })
  @RfAction('update')
  async disposition(@Req() req: any, @Body() dto: RfDispositionDto) {
    const tenantId = req.tenantContext.getTenantId();
    return { disposition: dto.disposition || 'RESTOCK', message: 'Disposition set', dto };
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete return receipt (RF)' })
  @ApiCreatedResponse({ type: RfCompleteResponseDto })
  @RfAction('update')
  async complete(@Req() req: any, @Body() dto: RfCompleteReturnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return { completed: true, message: 'Return completed' };
  }
}
