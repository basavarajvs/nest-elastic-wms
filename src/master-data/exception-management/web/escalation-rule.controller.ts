import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { ExceptionEscalationService } from '../exception-escalation.service';
import { CreateEscalationRuleDto } from '../dtos/escalation-rule.dto';

@ApiTags('WMS-WEB', 'Operations')
@Controller('web/escalation-rules')
@UseGuards(CaslGuard)
export class EscalationRuleController {
  constructor(private readonly escalationService: ExceptionEscalationService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'ExceptionEscalationRule' })
  @ApiOperation({ summary: 'Create an escalation rule' })
  async create(@Body() dto: CreateEscalationRuleDto, @Req() req: any) {
    return this.escalationService.createRule(dto, req.tenantContext.getTenantId());
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'ExceptionEscalationRule' })
  @ApiOperation({ summary: 'List escalation rules' })
  async findAll(@Req() req: any, @Query('facilityId') facilityId: string) {
    return this.escalationService.listRules(req.tenantContext.getTenantId(), facilityId);
  }
}
