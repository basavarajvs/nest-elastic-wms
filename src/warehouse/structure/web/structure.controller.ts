import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StructureService } from '../structure.service';

@ApiTags('Warehouse Structure')
@Controller('web')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Post('aisles')
  @ApiOperation({ summary: 'Create aisle' })
  async createAisle(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createAisle(tenantId, dto);
  }

  @Get('aisles')
  @ApiOperation({ summary: 'List aisles by facility/zone' })
  async findAisles(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findAisles(tenantId, BigInt(query.facilityId), query.zoneId ? BigInt(query.zoneId) : undefined);
  }

  @Delete('aisles/:id')
  @ApiOperation({ summary: 'Delete aisle' })
  async deleteAisle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteAisle(tenantId, BigInt(id));
  }

  @Post('bays')
  @ApiOperation({ summary: 'Create bay' })
  async createBay(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createBay(tenantId, dto);
  }

  @Get('bays')
  @ApiOperation({ summary: 'List bays by aisle' })
  async findBays(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findBays(tenantId, BigInt(query.facilityId), BigInt(query.aisleId));
  }

  @Delete('bays/:id')
  @ApiOperation({ summary: 'Delete bay' })
  async deleteBay(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteBay(tenantId, BigInt(id));
  }

  @Post('rack-rows')
  @ApiOperation({ summary: 'Create rack row' })
  async createRackRow(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createRackRow(tenantId, dto);
  }

  @Get('rack-rows')
  @ApiOperation({ summary: 'List rack rows by aisle' })
  async findRackRows(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findRackRows(tenantId, BigInt(query.facilityId), BigInt(query.aisleId));
  }

  @Delete('rack-rows/:id')
  @ApiOperation({ summary: 'Delete rack row' })
  async deleteRackRow(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteRackRow(tenantId, BigInt(id));
  }

  @Post('levels')
  @ApiOperation({ summary: 'Create rack level' })
  async createLevel(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createLevel(tenantId, dto);
  }

  @Get('levels')
  @ApiOperation({ summary: 'List levels by bay' })
  async findLevels(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLevels(tenantId, BigInt(query.facilityId), BigInt(query.bayId));
  }

  @Delete('levels/:id')
  @ApiOperation({ summary: 'Delete rack level' })
  async deleteLevel(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteLevel(tenantId, BigInt(id));
  }

  @Post('loading-docks')
  @ApiOperation({ summary: 'Create loading dock' })
  async createLoadingDock(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.createLoadingDock(tenantId, dto);
  }

  @Get('loading-docks')
  @ApiOperation({ summary: 'List loading docks by facility' })
  async findLoadingDocks(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLoadingDocks(tenantId, BigInt(query.facilityId), query);
  }

  @Get('loading-docks/:id')
  @ApiOperation({ summary: 'Get loading dock by ID' })
  async findLoadingDockById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.findLoadingDockById(tenantId, BigInt(id));
  }

  @Patch('loading-docks/:id')
  @ApiOperation({ summary: 'Update loading dock' })
  async updateLoadingDock(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.updateLoadingDock(tenantId, BigInt(id), dto);
  }

  @Delete('loading-docks/:id')
  @ApiOperation({ summary: 'Delete loading dock' })
  async deleteLoadingDock(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.structureService.deleteLoadingDock(tenantId, BigInt(id));
  }
}
