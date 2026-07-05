import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ReportsService } from '../reports.service';

@ApiTags('Reports')
@Controller('web/reports')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ReportsWebController {
  constructor(
    private readonly reportsService: ReportsService,
    @InjectQueue('report-generation') private readonly reportQueue: Queue,
  ) {}

  @Post('generate')
  @CheckAbility({ action: WmsAction.Create, subject: 'Report' })
  @AuditLog({ eventType: 'REPORT_GENERATE' })
  async generate(@Req() req: any, @Body() dto: { reportType: string; parameters?: Record<string, any> }) {
    const tenantId = req.tenantContext.getTenantId();
    const job = await this.reportsService.createJob(tenantId, {
      reportType: dto.reportType,
      parameters: dto.parameters,
    });
    await this.reportQueue.add('generate', {
      jobId: String(job.id),
      tenantId,
      reportType: dto.reportType,
      parameters: dto.parameters,
    });
    return job;
  }

  @Get('jobs')
  @CheckAbility({ action: WmsAction.List, subject: 'Report' })
  async findAllJobs(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.reportsService.findAllJobs(tenantId, query);
  }

  @Get('jobs/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'Report' })
  async findJobById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.reportsService.findJobById(tenantId, id);
  }

  @Get('jobs/:id/download')
  @CheckAbility({ action: WmsAction.Read, subject: 'Report' })
  async getDownloadUrl(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const job = await this.reportsService.findJobById(tenantId, id);
    if (!job) return { url: null };
    return { url: job.download_url || null, expiresAt: job.expires_at };
  }

  @Delete('jobs/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'Report' })
  @AuditLog({ eventType: 'REPORT_JOB_DELETE' })
  async removeJob(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.reportsService.deleteJob(tenantId, id);
  }
}
