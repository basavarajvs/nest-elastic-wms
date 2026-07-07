import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ReturnsService } from '../returns.service';
import { ReturnDto, ReturnListResponseDto, DeleteResultDto, CreateReturnDto, UpdateReturnDto, ReceiveReturnDto } from '../dtos/returns-response.dto';

@ApiTags('Customer Returns')
@Controller('web/customer-returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer return with items' })
  @ApiCreatedResponse({ type: ReturnDto })
  async create(@Req() req: any, @Body() dto: CreateReturnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer returns' })
  @ApiOkResponse({ type: ReturnListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer return with items' })
  @ApiOkResponse({ type: ReturnDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer return' })
  @ApiOkResponse({ type: ReturnDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReturnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer return' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.returnsService.delete(tenantId, BigInt(id));
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive returned items (creates inventory holds for QC)' })
  @ApiCreatedResponse({ type: ReturnDto })
  async receiveReturn(@Req() req: any, @Param('id') id: string, @Body() dto: ReceiveReturnDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.user?.userId || 'SYSTEM';
    return this.returnsService.receiveReturn(tenantId, BigInt(id), userId, dto);
  }
}
