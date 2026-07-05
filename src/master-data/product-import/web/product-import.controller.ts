import { Controller, Delete, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ProductImportService } from '../product-import.service';

@ApiTags('Product Import')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/products')
export class ProductImportController {
  constructor(private readonly productImportService: ProductImportService) {}

  @Post('import')
  @CheckAbility({ action: 'create', subject: 'Product' })
  @ApiOperation({ summary: 'Start product import job' })
  async createJob(@Req() req: any, @Body() dto: any) {
    return this.productImportService.createJob(req.tenantContext.getTenantId(), dto);
  }

  @Get('import-jobs')
  @CheckAbility({ action: 'list', subject: 'Product' })
  @ApiOperation({ summary: 'List product import jobs' })
  async findJobs(@Req() req: any, @Query() query: any) {
    return this.productImportService.findJobs(req.tenantContext.getTenantId(), query);
  }

  @Get('import-jobs/:id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @ApiOperation({ summary: 'Get product import job with results' })
  async findJobById(@Req() req: any, @Param('id') id: string) {
    return this.productImportService.findJobById(req.tenantContext.getTenantId(), BigInt(id));
  }

  @Delete('import-jobs/:id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  @ApiOperation({ summary: 'Delete product import job' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.productImportService.delete(req.tenantContext.getTenantId(), BigInt(id));
  }
}
