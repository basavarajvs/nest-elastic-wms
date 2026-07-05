import { Controller, Delete, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductClientAssignmentService } from '../product-client-assignment.service';

@ApiTags('Product Client Assignments')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/product-client-assignments')
export class ProductClientAssignmentController {
  constructor(private readonly assignmentService: ProductClientAssignmentService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Create product-client assignment' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.assignmentService.create(req.tenantContext.getTenantId(), dto);
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product-client assignments' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.assignmentService.findAll(req.tenantContext.getTenantId(), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product-client assignment' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.assignmentService.findById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Get('by-product/:productId')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Find assignments by product' })
  async findByProduct(@Req() req: any, @Param('productId') productId: string) {
    return this.assignmentService.findByProduct(req.tenantContext.getTenantId(), BigInt(productId));
  }

  @Get('by-client/:clientId')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Find assignments by client' })
  async findByClient(@Req() req: any, @Param('clientId') clientId: string) {
    return this.assignmentService.findByClient(req.tenantContext.getTenantId(), BigInt(clientId));
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product-client assignment' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.assignmentService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
