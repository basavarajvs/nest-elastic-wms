import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from '../common/guards/rf-session.guard';
import { RfAction } from '../common/guards/rf-action.decorator';

@ApiTags('Master-Data', 'WMS-WEB')
@Controller()
export class WarehouseZoneController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('web')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseZone' })
  async findAllWeb(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;

    return (this.prisma as any).warehouseZone.findMany({
      where,
      include: {
        facility: { select: { id: true, facilityCode: true, name: true } },
        _count: { select: { locations: true } },
      },
    });
  }

  @Get('rf')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findAllRf(
    @Req() req: any,
    @Query('facilityId') facilityId?: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;

    const zones = await (this.prisma as any).warehouseZone.findMany({ where });
    return zones.map((z: any) => ({
      id: z.id,
      zoneCode: z.zoneCode,
      name: z.name,
      zoneType: z.zoneType,
      isActive: z.isActive,
    }));
  }
}
