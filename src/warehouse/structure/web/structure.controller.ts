import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AisleResponseDto, BayResponseDto, RackRowResponseDto, LevelResponseDto, LoadingDockResponseDto, CreateAisleDto, CreateBayDto, CreateRackRowDto, CreateLevelDto, CreateLoadingDockDto, UpdateLoadingDockDto } from '../dtos/structure.dto';
import { StructureService } from '../structure.service';

@ApiTags('Warehouse Structure')
@Controller('web')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Post('aisles')
  @ApiOperation({ summary: 'Create aisle' })
  @ApiCreatedResponse({ type: AisleResponseDto })
  async createAisle(@Req() req: any, @Body() dto: CreateAisleDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createAisle(tenantId, dto);
  }

  @Get('aisles')
  @ApiOperation({ summary: 'List aisles by facility/zone' })
  @ApiOkResponse({ type: AisleResponseDto, isArray: true })
  async findAisles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findAisles(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query.zoneId ? BigInt(query.zoneId) : undefined);
  }

  @Delete('aisles/:id')
  @ApiOperation({ summary: 'Delete aisle' })
  @ApiOkResponse({ type: AisleResponseDto })
  async deleteAisle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteAisle(tenantId, BigInt(id));
  }

  @Post('bays')
  @ApiOperation({ summary: 'Create bay' })
  @ApiCreatedResponse({ type: BayResponseDto })
  async createBay(@Req() req: any, @Body() dto: CreateBayDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createBay(tenantId, dto);
  }

  @Get('bays')
  @ApiOperation({ summary: 'List bays by aisle' })
  @ApiOkResponse({ type: BayResponseDto, isArray: true })
  async findBays(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findBays(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query.aisleId ? BigInt(query.aisleId) : (undefined as any));
  }

  @Delete('bays/:id')
  @ApiOperation({ summary: 'Delete bay' })
  @ApiOkResponse({ type: BayResponseDto })
  async deleteBay(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteBay(tenantId, BigInt(id));
  }

  @Post('rack-rows')
  @ApiOperation({ summary: 'Create rack row' })
  @ApiCreatedResponse({ type: RackRowResponseDto })
  async createRackRow(@Req() req: any, @Body() dto: CreateRackRowDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createRackRow(tenantId, dto);
  }

  @Get('rack-rows')
  @ApiOperation({ summary: 'List rack rows by aisle' })
  @ApiOkResponse({ type: RackRowResponseDto, isArray: true })
  async findRackRows(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findRackRows(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query.aisleId ? BigInt(query.aisleId) : (undefined as any));
  }

  @Delete('rack-rows/:id')
  @ApiOperation({ summary: 'Delete rack row' })
  @ApiOkResponse({ type: RackRowResponseDto })
  async deleteRackRow(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteRackRow(tenantId, BigInt(id));
  }

  @Post('levels')
  @ApiOperation({ summary: 'Create rack level' })
  @ApiCreatedResponse({ type: LevelResponseDto })
  async createLevel(@Req() req: any, @Body() dto: CreateLevelDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createLevel(tenantId, dto);
  }

  @Get('levels')
  @ApiOperation({ summary: 'List levels by bay' })
  @ApiOkResponse({ type: LevelResponseDto, isArray: true })
  async findLevels(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLevels(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query.bayId ? BigInt(query.bayId) : (undefined as any));
  }

  @Delete('levels/:id')
  @ApiOperation({ summary: 'Delete rack level' })
  @ApiOkResponse({ type: LevelResponseDto })
  async deleteLevel(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteLevel(tenantId, BigInt(id));
  }

  @Post('loading-docks')
  @ApiOperation({ summary: 'Create loading dock' })
  @ApiCreatedResponse({ type: LoadingDockResponseDto })
  async createLoadingDock(@Req() req: any, @Body() dto: CreateLoadingDockDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createLoadingDock(tenantId, dto);
  }

  @Get('loading-docks')
  @ApiOperation({ summary: 'List loading docks by facility' })
  @ApiOkResponse({ type: LoadingDockResponseDto, isArray: true })
  async findLoadingDocks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLoadingDocks(tenantId, query.facilityId ? BigInt(query.facilityId) : (undefined as any), query);
  }

  @Get('loading-docks/:id')
  @ApiOperation({ summary: 'Get loading dock by ID' })
  @ApiOkResponse({ type: LoadingDockResponseDto })
  async findLoadingDockById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLoadingDockById(tenantId, BigInt(id));
  }

  @Patch('loading-docks/:id')
  @ApiOperation({ summary: 'Update loading dock' })
  @ApiOkResponse({ type: LoadingDockResponseDto })
  async updateLoadingDock(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLoadingDockDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.updateLoadingDock(tenantId, BigInt(id), dto);
  }

  @Delete('loading-docks/:id')
  @ApiOperation({ summary: 'Delete loading dock' })
  @ApiOkResponse({ type: LoadingDockResponseDto })
  async deleteLoadingDock(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteLoadingDock(tenantId, BigInt(id));
  }
}
