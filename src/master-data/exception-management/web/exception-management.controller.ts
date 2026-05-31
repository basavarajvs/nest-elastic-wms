import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ExceptionManagementService } from '../exception-management.service';
import { CreateExceptionDto, UpdateExceptionDto } from '../dtos/create-exception.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/exceptions')
@UseGuards(CaslGuard)
export class ExceptionManagementWebController {
  constructor(private readonly service: ExceptionManagementService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'Report an exception' })
  async create(@Body() dto: CreateExceptionDto, @Req() req: any) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'List exceptions' })
  async findAll(@Req() req: any, @Query('status') status: string, @Query('facilityId') facilityId: string) {
    return this.service.findAll(req.tenantContext.getTenantId(), { status, facilityId });
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'Get exception by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'Update exception (status, assignment, resolution)' })
  async update(@Param('id') id: string, @Body() dto: UpdateExceptionDto, @Req() req: any) {
    return this.service.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'Delete an exception' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.delete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
