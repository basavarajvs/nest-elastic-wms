import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionFilterDto } from '../dtos/customization.dto';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../common/guards/casl.guard';

@ApiTags('Admin')
@Controller('web/customization/executions')
@UseGuards(CaslGuard)
export class ExecutionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @CheckAbility({ action: 'read', subject: 'WmsExecutionInstance' })
  async list(@Req() req: any, @Query() filter: ExecutionFilterDto) {
    const where: any = { tenantId: req.tenantContext.getTenantId() };
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.status) where.status = filter.status;
    if (filter.dateFrom || filter.dateTo) {
      where.startedAt = {};
      if (filter.dateFrom) where.startedAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.startedAt.lte = new Date(filter.dateTo);
    }

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 50, 200);

    const [data, total] = await Promise.all([
      (this.prisma as any).wmsExecutionInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      (this.prisma as any).wmsExecutionInstance.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'WmsExecutionInstance' })
  async get(@Req() req: any, @Param('id') id: string) {
    const instance = await (this.prisma as any).wmsExecutionInstance.findFirst({
      where: { id, tenantId: req.tenantContext.getTenantId() },
    });
    if (!instance) throw new Error('Execution instance not found');
    return instance;
  }
}
