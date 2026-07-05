import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { PerformanceService } from '../performance/performance.service';

@ApiTags('Labor Performance')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/labor/performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'Labor' })
  @ApiOperation({ summary: 'List performance metrics' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.performanceService.findAll(tenantId, query);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Labor' })
  @ApiOperation({ summary: 'Delete performance metric' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.performanceService.delete(tenantId, BigInt(id));
  }
}
