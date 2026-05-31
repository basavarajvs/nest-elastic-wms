import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CarrierService } from '../carrier.service';
import { CreateCarrierDto, UpdateCarrierDto } from '../dtos/create-carrier.dto';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { CaslGuard } from '../../../common/guards/casl.guard';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/carriers')
@UseGuards(CaslGuard)
export class CarrierWebController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Carrier' })
  async create(@Req() req: any, @Body() dto: CreateCarrierDto) {
    return this.carrierService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Carrier' })
  async findAll(@Req() req: any) {
    return this.carrierService.findAll(req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Carrier' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.carrierService.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Carrier' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCarrierDto) {
    return this.carrierService.update(id, req.tenantContext.getTenantId(), dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Carrier' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.carrierService.delete(id, req.tenantContext.getTenantId());
    return { success: true };
  }
}
