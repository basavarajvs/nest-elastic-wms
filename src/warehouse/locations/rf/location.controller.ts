import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { LocationService } from '../location.service';
import { RfLocationLookupRequestDto, RfLocationLookupDto } from '../dtos/location.dto';

@ApiTags('WMS-RF')
@Controller('rf/locations')
export class RfLocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('lookup')
  @ApiOperation({ summary: 'RF: Scan location barcode' })
  @RfAction('read')
  @ApiOkResponse({ type: RfLocationLookupDto })
  async lookup(@Req() req: any, @Body() dto: RfLocationLookupRequestDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.locationService.rfLookup(tenantId, dto.barcode);
  }
}
