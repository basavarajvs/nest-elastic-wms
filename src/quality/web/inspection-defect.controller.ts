import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateInspectionDefectDto, UpdateInspectionDefectDto, InspectionDefectResponseDto } from '../dtos/inspection.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { InspectionDefectService } from '../inspection-defect.service';

@ApiTags('Inspection Defects')
@Controller('web/inspection-defects')
export class InspectionDefectController {
  constructor(private readonly service: InspectionDefectService) {}

  @Post()
  @ApiOperation({ summary: 'Create inspection defect record' })
  @ApiCreatedResponse({ type: InspectionDefectResponseDto })
  async create(@Req() req: any, @Body() dto: CreateInspectionDefectDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inspection defect records' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspection defect record' })
  @ApiOkResponse({ type: InspectionDefectResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inspection defect record' })
  @ApiOkResponse({ type: InspectionDefectResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateInspectionDefectDto) {
    return this.service.update(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inspection defect record' })
  @ApiOkResponse({ type: InspectionDefectResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(BigInt(id));
  }
}
