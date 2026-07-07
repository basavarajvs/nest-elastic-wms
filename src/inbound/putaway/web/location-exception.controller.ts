import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { LocationExceptionDto, LocationExceptionListResponseDto, CreateLocationExceptionDto } from '../dtos/putaway-response.dto';

@Controller('web/location-exceptions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class LocationExceptionWebController {
  constructor(private readonly prisma: PrismaService) {}

  private async enrichExceptionRow(r: any) {
    if (!r) return r;
    const location = r.location_id ? await this.prisma.storage_locations.findFirst({
      where: { tenant_id: r.tenant_id, location_id: r.location_id },
      select: { location_name: true },
    }) : null;
    return { ...r, location_name: location?.location_name ?? null };
  }

  private async enrichExceptionRows(rows: any[]): Promise<any[]> {
    if (!rows.length) return rows;
    const tenantId = rows[0].tenant_id;
    const locationIds = [...new Set(rows.map(r => r.location_id).filter(Boolean))] as bigint[];
    const locations = locationIds.length ? await this.prisma.storage_locations.findMany({
      where: { tenant_id: tenantId, location_id: { in: locationIds } },
      select: { location_id: true, location_name: true },
    }) : Promise.resolve([]);
    const locMap = new Map<bigint, string>();
    (await locations).forEach(l => locMap.set(l.location_id, l.location_name));
    return rows.map(r => ({ ...r, location_name: locMap.get(r.location_id) ?? null }));
  }

  @Post()
  @ApiOperation({ summary: 'Create location exception' })
  @ApiCreatedResponse({ type: LocationExceptionDto })
  async create(@Req() req: any, @Body() dto: CreateLocationExceptionDto) {
    const tenantId = req.tenantContext.getTenantId();
    const row = await this.prisma.location_exceptions.create({
      data: {
        tenant_id: tenantId,
        location_id: BigInt(dto.location_id),
        exception_type: dto.reason_code || 'FULL',
        reported_at: new Date(),
        notes: dto.notes || null,
      },
    });
    return this.enrichExceptionRow(row);
  }

  @Get()
  @ApiOperation({ summary: 'List location exceptions' })
  @ApiOkResponse({ type: LocationExceptionListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    const where: any = { tenant_id: tenantId };
    if (query.locationId) where.location_id = BigInt(query.locationId);
    if (query.exceptionType) where.exception_type = query.exceptionType;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const [data, total] = await Promise.all([
      this.prisma.location_exceptions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reported_at: 'desc' },
      }),
      this.prisma.location_exceptions.count({ where }),
    ]);
    return { data: await this.enrichExceptionRows(data), total, page, limit };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location exception' })
  @ApiOkResponse({ type: LocationExceptionDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const row = await this.prisma.location_exceptions.findFirst({
      where: { tenant_id: tenantId, exception_id: BigInt(id) },
    });
    return this.enrichExceptionRow(row);
  }
}
