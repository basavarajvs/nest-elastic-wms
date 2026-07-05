import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ExceptionManagementService } from '../exception-management.service';
import { ExceptionCommentService } from '../exception-comment.service';
import { ExceptionEscalationService } from '../exception-escalation.service';

@ApiTags('Exception Management')
@Controller('web/exceptions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class ExceptionWebController {
  constructor(
    private readonly exceptionManagementService: ExceptionManagementService,
    private readonly exceptionCommentService: ExceptionCommentService,
    private readonly exceptionEscalationService: ExceptionEscalationService,
  ) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionManagementService.create(tenantId, { ...dto, createdBy: userId, reportedByUserId: userId });
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionManagement' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionManagementService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ExceptionManagement' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionManagementService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionManagementService.update(tenantId, BigInt(id), { ...dto, updatedBy: userId });
  }

  @Post(':id/acknowledge')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_ACKNOWLEDGE' })
  async acknowledge(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.exceptionManagementService.acknowledge(tenantId, BigInt(id), userId);
  }

  @Post(':id/resolve')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_RESOLVE' })
  async resolve(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    return this.exceptionManagementService.resolve(tenantId, BigInt(id), dto, userId);
  }

  @Get(':id/comments')
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionComment' })
  async getComments(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionCommentService.getComments(tenantId, BigInt(id));
  }

  @Post(':id/comments')
  @CheckAbility({ action: WmsAction.Create, subject: 'ExceptionComment' })
  @AuditLog({ eventType: 'EXCEPTION_COMMENT_ADD' })
  async addComment(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionCommentService.addComment(tenantId, BigInt(id), { ...dto, commentedByUserId: userId, createdBy: userId });
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_DELETE' })
  @ApiOperation({ summary: 'Delete exception' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionManagementService.delete(tenantId, BigInt(id));
  }
}

@ApiTags('Exception Escalation Rules')
@Controller('web/escalation-rules')
@UseGuards(JwtAuthGuard, CaslGuard)
export class EscalationRuleWebController {
  constructor(private readonly exceptionEscalationService: ExceptionEscalationService) {}

  @Post()
  @CheckAbility({ action: WmsAction.Create, subject: 'ExceptionEscalationRule' })
  @AuditLog({ eventType: 'ESCALATION_RULE_CREATE' })
  async create(@Req() req: any, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionEscalationService.create(tenantId, { ...dto, createdBy: userId });
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionEscalationRule' })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ExceptionEscalationRule' })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionEscalationRule' })
  @AuditLog({ eventType: 'ESCALATION_RULE_UPDATE' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionEscalationService.update(tenantId, BigInt(id), { ...dto, updatedBy: userId });
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ExceptionEscalationRule' })
  @AuditLog({ eventType: 'ESCALATION_RULE_DELETE' })
  @ApiOperation({ summary: 'Delete escalation rule' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.delete(tenantId, BigInt(id));
  }
}
