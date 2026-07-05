import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReturnsService } from '../returns.service';

@ApiTags('Customer Returns')
@Controller('web/customer-returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer return with items' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer returns' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer return with items' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer return' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer return' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.delete(tenantId, BigInt(id));
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive returned items (creates inventory holds for QC)' })
  async receiveReturn(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.user?.userId || 'SYSTEM';
    return this.returnsService.receiveReturn(tenantId, BigInt(id), userId, dto);
  }
}
