import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { ProductService, ProductProjection } from '../product.service';
import { ProductImportService } from '../product-import.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductFilterDto } from '../dtos/product-filter.dto';
import { QuotaCheck } from '../../common/decorators/quota-check.decorator';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { QuotaGuard } from '../../common/guards/quota.guard';
import { CaslGuard } from '../../common/guards/casl.guard';

@Controller('web/products')
@UseGuards(CaslGuard)
export class ProductsWebController {
  constructor(
    private readonly productService: ProductService,
    private readonly importService: ProductImportService,
  ) {}

  @Post()
  @UseGuards(QuotaGuard)
  @QuotaCheck('products')
  @CheckAbility({ action: 'create', subject: 'Product' })
  async create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'list', subject: 'Product' })
  async findAll(@Req() req: any, @Query() filter: ProductFilterDto) {
    return this.productService.list(req.tenantContext.getTenantId(), filter, ProductProjection.WEB);
  }

  @Get('tree')
  @CheckAbility({ action: 'read', subject: 'ProductCategory' })
  async getTree(@Req() req: any) {
    return this.productService.getCategoryTree(req.tenantContext.getTenantId());
  }

  @Get('import/:jobId')
  @CheckAbility({ action: 'read', subject: 'Product' })
  async getImportStatus(@Req() req: any, @Param('jobId') jobId: string) {
    return this.importService.getJobStatus(jobId, req.tenantContext.getTenantId());
  }

  @Get('import/:jobId/errors.csv')
  @CheckAbility({ action: 'read', subject: 'Product' })
  async downloadErrorCsv(@Req() req: any, @Param('jobId') jobId: string) {
    const csv = await this.importService.generateErrorCsv(
      jobId,
      req.tenantContext.getTenantId(),
    );
    return csv;
  }

  @Post('import')
  @CheckAbility({ action: 'create', subject: 'Product' })
  async uploadImport(@Req() req: any, @Body('file') fileBuffer: string, @Body('fileName') fileName: string) {
    if (!fileBuffer || !fileName) {
      return this.handleFileUpload(req, { fileBuffer, fileName });
    }
    return this.importService.uploadFile(
      Buffer.from(fileBuffer, 'base64'),
      fileName,
      req.tenantContext.getTenantId(),
    );
  }

  private async handleFileUpload(req: any, file: { fileBuffer: string; fileName: string }) {
    const buf = Buffer.from(file.fileBuffer, 'base64');
    return this.importService.uploadFile(buf, file.fileName, req.tenantContext.getTenantId());
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Product' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto, req.tenantContext.getTenantId());
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Product' })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.productService.softDelete(id, req.tenantContext.getTenantId());
    return { deleted: true };
  }
}
