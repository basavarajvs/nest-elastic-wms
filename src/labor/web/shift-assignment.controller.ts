import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateShiftAssignmentDto, UpdateShiftAssignmentDto, ShiftAssignmentResponseDto } from '../dtos/shift-response.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ShiftAssignmentService } from '../shift-assignment.service';

@ApiTags('Labor Shift Assignments')
@Controller('web/labor/shift-assignments')
export class ShiftAssignmentController {
  constructor(private readonly service: ShiftAssignmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create shift assignment' })
  @ApiCreatedResponse({ type: ShiftAssignmentResponseDto })
  async create(@Req() req: any, @Body() dto: CreateShiftAssignmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List shift assignments' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift assignment' })
  @ApiOkResponse({ type: ShiftAssignmentResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shift assignment' })
  @ApiOkResponse({ type: ShiftAssignmentResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateShiftAssignmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift assignment' })
  @ApiOkResponse({ type: ShiftAssignmentResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.service.delete(tenantId, BigInt(id));
  }
}
