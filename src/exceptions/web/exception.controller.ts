import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { WmsAction } from '../../casl/casl.types';
import { ExceptionManagementService } from '../exception-management.service';
import { ExceptionCommentService } from '../exception-comment.service';
import { ExceptionEscalationService } from '../exception-escalation.service';
import { DeleteResultDto } from '../../common/dto/paginated-response.dto';
import {
  ExceptionManagementDto,
  ExceptionListResponseDto,
  ExceptionCommentDto,
  EscalationRuleDto,
  EscalationRuleListResponseDto,
  CreateExceptionDto,
  UpdateExceptionDto,
  ResolveExceptionDto,
  AddCommentDto,
  CreateEscalationRuleDto,
  UpdateEscalationRuleDto,
} from '../dto/exception-response.dto';

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
  @ApiOperation({ summary: 'Create exception' })
  @ApiCreatedResponse({ type: ExceptionManagementDto })
  async create(@Req() req: any, @Body() dto: CreateExceptionDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionManagementService.create(tenantId, { ...dto, created_by: userId, reported_by_user_id: userId });
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'List exceptions' })
  @ApiOkResponse({ type: ExceptionListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionManagementService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ExceptionManagement' })
  @ApiOperation({ summary: 'Get exception by ID' })
  @ApiOkResponse({ type: ExceptionManagementDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionManagementService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_UPDATE' })
  @ApiOperation({ summary: 'Update exception' })
  @ApiOkResponse({ type: ExceptionManagementDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExceptionDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    await this.exceptionManagementService.update(tenantId, BigInt(id), { ...dto, updated_by: userId });
    return this.exceptionManagementService.findById(tenantId, BigInt(id));
  }

  @Post(':id/acknowledge')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_ACKNOWLEDGE' })
  @ApiOperation({ summary: 'Acknowledge exception' })
  @ApiOkResponse({ type: ExceptionManagementDto })
  async acknowledge(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    await this.exceptionManagementService.acknowledge(tenantId, BigInt(id), userId);
    return this.exceptionManagementService.findById(tenantId, BigInt(id));
  }

  @Post(':id/resolve')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_RESOLVE' })
  @ApiOperation({ summary: 'Resolve exception' })
  @ApiOkResponse({ type: ExceptionManagementDto })
  async resolve(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveExceptionDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub || req.rfSession?.userId;
    await this.exceptionManagementService.resolve(tenantId, BigInt(id), dto, userId);
    return this.exceptionManagementService.findById(tenantId, BigInt(id));
  }

  @Get(':id/comments')
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionComment' })
  @ApiOperation({ summary: 'Get exception comments' })
  @ApiOkResponse({ type: [ExceptionCommentDto] })
  async getComments(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionCommentService.getComments(tenantId, BigInt(id));
  }

  @Post(':id/comments')
  @CheckAbility({ action: WmsAction.Create, subject: 'ExceptionComment' })
  @AuditLog({ eventType: 'EXCEPTION_COMMENT_ADD' })
  @ApiOperation({ summary: 'Add comment to exception' })
  @ApiCreatedResponse({ type: ExceptionCommentDto })
  async addComment(@Req() req: any, @Param('id') id: string, @Body() dto: AddCommentDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionCommentService.addComment(tenantId, BigInt(id), { ...dto, commented_by_user_id: userId, created_by: userId });
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ExceptionManagement' })
  @AuditLog({ eventType: 'EXCEPTION_DELETE' })
  @ApiOperation({ summary: 'Delete exception' })
  @ApiOkResponse({ type: DeleteResultDto })
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
  @ApiOperation({ summary: 'Create escalation rule' })
  @ApiCreatedResponse({ type: EscalationRuleDto })
  async create(@Req() req: any, @Body() dto: CreateEscalationRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.exceptionEscalationService.create(tenantId, { ...dto, created_by: userId });
  }

  @Get()
  @CheckAbility({ action: WmsAction.List, subject: 'ExceptionEscalationRule' })
  @ApiOperation({ summary: 'List escalation rules' })
  @ApiOkResponse({ type: EscalationRuleListResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: WmsAction.Read, subject: 'ExceptionEscalationRule' })
  @ApiOperation({ summary: 'Get escalation rule by ID' })
  @ApiOkResponse({ type: EscalationRuleDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.findById(tenantId, BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: WmsAction.Update, subject: 'ExceptionEscalationRule' })
  @AuditLog({ eventType: 'ESCALATION_RULE_UPDATE' })
  @ApiOperation({ summary: 'Update escalation rule' })
  @ApiOkResponse({ type: EscalationRuleDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateEscalationRuleDto) {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    await this.exceptionEscalationService.update(tenantId, BigInt(id), { ...dto, updated_by: userId });
    return this.exceptionEscalationService.findById(tenantId, BigInt(id));
  }

  @Delete(':id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'ExceptionEscalationRule' })
  @AuditLog({ eventType: 'ESCALATION_RULE_DELETE' })
  @ApiOperation({ summary: 'Delete escalation rule' })
  @ApiOkResponse({ type: DeleteResultDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.exceptionEscalationService.delete(tenantId, BigInt(id));
  }
}
