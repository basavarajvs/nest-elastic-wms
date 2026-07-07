import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { RuleResponseDto, RuleResultDto, CreateRuleDto, UpdateRuleDto, EvaluateRuleDto } from '../dtos/rule.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { RuleEngineService } from '../rule-engine.service';

@ApiTags('Workflow - Rules')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/workflow/rules')
export class RuleController {
  constructor(private readonly ruleEngineService: RuleEngineService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Workflow' })
  @ApiOperation({ summary: 'Create rule definition' })
  @ApiCreatedResponse({ type: RuleResponseDto })
  async create(@Req() req: any, @Body() dto: CreateRuleDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.ruleEngineService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'List rule definitions' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Get rule definition by ID' })
  @ApiOkResponse({ type: RuleResponseDto })
  async findById(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Workflow' })
  @ApiOperation({ summary: 'Update rule definition' })
  @ApiOkResponse({ type: RuleResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRuleDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.ruleEngineService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Workflow' })
  @ApiOperation({ summary: 'Delete rule definition' })
  @ApiOkResponse({ type: RuleResponseDto })
  async delete(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.delete(tenantId, id);
  }

  @Post(':id/evaluate')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Evaluate a rule' })
  @ApiCreatedResponse({ type: RuleResultDto })
  async evaluate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: EvaluateRuleDto,
  ): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.evaluate(tenantId, dto.rule_key, dto.input);
  }
}
