import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ClientService } from '../client.service';
import { CreateClientDto, UpdateClientDto } from '../dtos/create-client.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/clients')
@UseGuards(CaslGuard)
export class ClientWebController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Client' })
  async create(@Req() req: any, @Body() dto: CreateClientDto) {
    return this.clientService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findAll(@Req() req: any) {
    return this.clientService.findAll(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Client' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.clientService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Client' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Client' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.clientService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
