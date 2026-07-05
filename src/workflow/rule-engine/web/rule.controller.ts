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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
  async create(@Req() req: any, @Body() dto: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.ruleEngineService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'List rule definitions' })
  async findAll(@Req() req: any, @Query() query: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Get rule definition by ID' })
  async findById(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Workflow' })
  @ApiOperation({ summary: 'Update rule definition' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.ruleEngineService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Workflow' })
  @ApiOperation({ summary: 'Delete rule definition' })
  async delete(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.delete(tenantId, id);
  }

  @Post(':id/evaluate')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Evaluate a rule' })
  async evaluate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { ruleKey: string; input: Record<string, any> },
  ): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.ruleEngineService.evaluate(tenantId, dto.ruleKey, dto.input);
  }
}
