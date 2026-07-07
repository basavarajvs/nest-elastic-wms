import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RouteStopService } from '../route-stop.service';
import {
  RouteStopDto, RouteStopPaginatedResponseDto,
  CreateRouteStopDto, UpdateRouteStopDto,
} from '../dtos/response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Outbound - Route Stops')
@Controller('web/route-stops')
export class RouteStopWebController {
  constructor(private readonly service: RouteStopService) {}

  @Post()
  @ApiOperation({ summary: 'Create route stop' })
  @ApiCreatedResponse({ type: RouteStopDto })
  async create(@Req() req: any, @Body() dto: CreateRouteStopDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List route stops' })
  @ApiOkResponse({ type: RouteStopPaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route stop by ID' })
  @ApiOkResponse({ type: RouteStopDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update route stop' })
  @ApiOkResponse({ type: RouteStopDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRouteStopDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete route stop' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
