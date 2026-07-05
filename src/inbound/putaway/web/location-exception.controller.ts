import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('web/location-exceptions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class LocationExceptionWebController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.location_exceptions.create({
      data: {
        tenant_id: tenantId,
        location_id: BigInt(dto.locationId),
        exception_type: dto.exceptionType || 'FULL',
        reported_by: dto.reportedBy || null,
        reported_at: new Date(),
        notes: dto.notes || null,
      },
    });
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenant_id: tenantId };
    if (query.locationId) where.location_id = BigInt(query.locationId);
    if (query.exceptionType) where.exception_type = query.exceptionType;
    const page = query.page || 1;
    const limit = query.limit || 50;
    const [data, total] = await Promise.all([
      this.prisma.location_exceptions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reported_at: 'desc' },
      }),
      this.prisma.location_exceptions.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  @Get(':id')
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.prisma.location_exceptions.findFirst({
      where: { tenant_id: tenantId, exception_id: BigInt(id) },
    });
  }
}
