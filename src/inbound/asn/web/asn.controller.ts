import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AsnService } from '../asn.service';
import { AsnImportService } from '../asn-import.service';
import {
  AdvanceShipNoticeDto,
  AsnListResponseDto,
  AsnLineDto,
  AsnImportJobDto,
  AsnImportJobListResponseDto,
  CreateAsnDto,
  UpdateAsnDto,
  CreateAsnImportJobDto,
} from '../dtos/asn-response.dto';
import { DeleteResultDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Advance Ship Notices')
@Controller('web/advance-ship-notices')
export class AsnController {
  constructor(
    private readonly asnService: AsnService,
    private readonly asnImportService: AsnImportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create ASN with lines' })
  @ApiCreatedResponse({ type: AdvanceShipNoticeDto })
  async create(@Req() req: any, @Body() dto: CreateAsnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List ASNs' })
  @ApiOkResponse({ type: AsnListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ASN' })
  @ApiOkResponse({ type: AdvanceShipNoticeDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ASN' })
  @ApiOkResponse({ type: AdvanceShipNoticeDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAsnDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.update(tenantId, BigInt(id), dto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update ASN status' })
  @ApiOkResponse({ type: AdvanceShipNoticeDto })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.updateStatus(tenantId, BigInt(id), status as any);
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Get ASN lines' })
  @ApiOkResponse({ type: AsnLineDto, isArray: true })
  async findLines(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.findLines(tenantId, BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ASN' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnService.delete(tenantId, BigInt(id));
  }

  @Post('import/jobs')
  @ApiOperation({ summary: 'Create ASN import job' })
  @ApiCreatedResponse({ type: AsnImportJobDto })
  async createJob(@Req() req: any, @Body() dto: CreateAsnImportJobDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnImportService.createJob(tenantId, dto);
  }

  @Get('import/jobs')
  @ApiOperation({ summary: 'List ASN import jobs' })
  @ApiOkResponse({ type: AsnImportJobListResponseDto })
  async findJobs(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnImportService.findJobs(tenantId, query);
  }

  @Get('import/jobs/:id')
  @ApiOperation({ summary: 'Get ASN import job with documents' })
  @ApiOkResponse({ type: AsnImportJobDto })
  async findJobById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.asnImportService.findJobById(tenantId, BigInt(id));
  }
}
