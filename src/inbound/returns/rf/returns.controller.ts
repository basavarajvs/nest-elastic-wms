import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { ReturnsService } from '../returns.service';

@ApiTags('RF - Returns')
@Controller('rf/inbound/returns')
export class RfReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'Lookup return by number (RF)' })
  @RfAction('read')
  async lookup(@Req() req: any, @Body('returnNumber') returnNumber: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.findAll(tenantId, { search: returnNumber, limit: 5, facilityId: '0' });
  }
}
