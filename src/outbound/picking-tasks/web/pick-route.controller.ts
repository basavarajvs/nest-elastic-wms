import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../../casl/casl.types';
import { PickRouteService } from '../pick-route.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PickRouteViewResponseDto, PickRouteOptimizeResponseDto } from '../dtos/response.dto';

@ApiTags('Outbound - Pick Routes')
@Controller('web/pick-routes')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PickRouteWebController {
  constructor(
    private readonly pickRouteService: PickRouteService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':waveId')
  @CheckAbility({ action: WmsAction.Read, subject: 'PickRoute' })
  @ApiOperation({ summary: 'View optimized pick route for a wave' })
  @ApiOkResponse({ type: PickRouteViewResponseDto })
  async getRoute(@Req() req: any, @Param('waveId') waveId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const routes = await this.prisma.pick_routes.findMany({
      where: { tenant_id: tenantId, wave_id: BigInt(waveId) },
      orderBy: { sequence_order: 'asc' },
    });
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: BigInt(waveId) },
    });
    return { routes, tasks, totalDistance: routes.reduce((s, r) => s + Number(r.estimated_travel_distance || 0), 0) };
  }

  @Post(':waveId/optimize')
  @CheckAbility({ action: WmsAction.Update, subject: 'PickRoute' })
  @ApiOperation({ summary: 'Re-optimize pick route for a wave' })
  @ApiCreatedResponse({ type: PickRouteOptimizeResponseDto })
  async reoptimize(@Req() req: any, @Param('waveId') waveId: string) {
    const tenantId = req.tenantContext.getTenantId();
    const tasks = await this.prisma.picking_tasks.findMany({
      where: { tenant_id: tenantId, wave_id: BigInt(waveId), status: { in: ['AVAILABLE', 'ASSIGNED'] } },
    });
    if (!tasks.length) return { message: 'No tasks to optimize' };
    const ordered = await this.pickRouteService.optimizePickRoute(tenantId, tasks);
    await this.pickRouteService.saveRoute(tenantId, BigInt(waveId), 'system', ordered);
    return { tasksOptimized: ordered.length, route: ordered as any[] };
  }
}
