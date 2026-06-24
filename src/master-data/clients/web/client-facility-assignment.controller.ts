import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ClientFacilityAssignmentService } from '../client-facility-assignment.service';
import { CreateClientFacilityAssignmentDto, UpdateClientFacilityAssignmentDto } from '../dtos/create-client-facility-assignment.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/client-facility-assignments')
@UseGuards(CaslGuard)
export class ClientFacilityAssignmentWebController {
  constructor(private readonly service: ClientFacilityAssignmentService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ClientFacilityAssignment' })
  async create(@Req() req: any, @Body() dto: CreateClientFacilityAssignmentDto) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ClientFacilityAssignment' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'facilityId', required: false })
  async findAll(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.service.findAll(req.tenantContext.getTenantId(), clientId, facilityId);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ClientFacilityAssignment' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ClientFacilityAssignment' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientFacilityAssignmentDto) {
    return this.service.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ClientFacilityAssignment' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(id, req.tenantContext.getTenantId());
  }
}
