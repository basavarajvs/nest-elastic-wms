import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductClientAssignmentsService } from '../product-client-assignments.service';
import { CreateProductClientAssignmentDto, UpdateProductClientAssignmentDto } from '../dtos/create-product-client-assignment.dto';

@ApiTags('WMS-WEB', 'Master-Data')
@Controller('web/product-client-assignments')
@UseGuards(CaslGuard)
export class ProductClientAssignmentsWebController {
  constructor(private readonly service: ProductClientAssignmentsService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Assign a product to a client' })
  async create(@Body() dto: CreateProductClientAssignmentDto, @Req() req: any) {
    return this.service.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'List all product-client assignments' })
  async findAll(@Req() req: any) {
    return this.service.findAll(req.tenantContext.getTenantId());
  }

  @Get('by-product/:productId')
  @CheckAbility({ action: 'read', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Find assignments by product' })
  async findByProduct(@Param('productId') productId: string, @Req() req: any) {
    return this.service.findByProduct(productId, req.tenantContext.getTenantId());
  }

  @Get('by-client/:clientId')
  @CheckAbility({ action: 'read', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Find assignments by client' })
  async findByClient(@Param('clientId') clientId: string, @Req() req: any) {
    return this.service.findByClient(clientId, req.tenantContext.getTenantId());
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.service.findById(id, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Update an assignment' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductClientAssignmentDto, @Req() req: any) {
    return this.service.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'ProductClientAssignment' })
  @ApiOperation({ summary: 'Delete an assignment' })
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.service.delete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
