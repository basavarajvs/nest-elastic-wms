import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CreateTemperatureLogDto, UpdateTemperatureLogDto, TemperatureLogResponseDto } from '../dtos/inspection.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { TemperatureLogService } from '../temperature-log.service';

@ApiTags('Temperature Logs')
@Controller('web/temperature-logs')
export class TemperatureLogController {
  constructor(private readonly service: TemperatureLogService) {}

  @Post()
  @ApiOperation({ summary: 'Create temperature log record' })
  @ApiCreatedResponse({ type: TemperatureLogResponseDto })
  async create(@Req() req: any, @Body() dto: CreateTemperatureLogDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List temperature log records' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get temperature log record' })
  @ApiOkResponse({ type: TemperatureLogResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update temperature log record' })
  @ApiOkResponse({ type: TemperatureLogResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTemperatureLogDto) {
    return this.service.update(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete temperature log record' })
  @ApiOkResponse({ type: TemperatureLogResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(BigInt(id));
  }
}
