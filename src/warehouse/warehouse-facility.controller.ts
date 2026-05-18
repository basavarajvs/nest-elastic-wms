import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CaslGuard } from '../common/guards/casl.guard';
import { RfSessionGuard } from '../common/guards/rf-session.guard';
import { RfAction } from '../common/guards/rf-action.decorator';

@ApiTags('Master-Data', 'WMS-WEB')
@Controller()
export class WarehouseFacilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('web')
  @UseGuards(CaslGuard)
  @CheckAbility({ action: 'read', subject: 'WarehouseFacility' })
  async findAllWeb(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    return (this.prisma as any).warehouseFacility.findMany({
      where: { tenantId },
      include: { _count: { select: { zones: true } } },
    });
  }

  @Get('rf')
  @UseGuards(RfSessionGuard)
  @RfAction('read')
  async findAllRf(@Req() req: any) {
    const tenantId = req.tenantContext.getTenantId();
    const facilities = await (this.prisma as any).warehouseFacility.findMany({
      where: { tenantId },
    });
    return facilities.map((f: any) => ({
      id: f.id,
      facilityCode: f.facilityCode,
      name: f.name,
      isActive: f.isActive,
    }));
  }
}
