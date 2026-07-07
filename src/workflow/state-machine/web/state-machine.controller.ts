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
import { StateMachineResponseDto, ExecutionInstanceResultDto, CreateStateMachineDto, UpdateStateMachineDto, ExecuteStateMachineDto } from '../dtos/state-machine.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { StateMachineService } from '../state-machine.service';

@ApiTags('Workflow - State Machines')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/workflow/state-machines')
export class StateMachineController {
  constructor(private readonly stateMachineService: StateMachineService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Workflow' })
  @ApiOperation({ summary: 'Create state machine definition' })
  @ApiCreatedResponse({ type: StateMachineResponseDto })
  async create(@Req() req: any, @Body() dto: CreateStateMachineDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.stateMachineService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'List state machine definitions' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.stateMachineService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Get state machine definition by ID' })
  @ApiOkResponse({ type: StateMachineResponseDto })
  async findById(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.stateMachineService.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Workflow' })
  @ApiOperation({ summary: 'Update state machine definition' })
  @ApiOkResponse({ type: StateMachineResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStateMachineDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.stateMachineService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Workflow' })
  @ApiOperation({ summary: 'Delete state machine definition' })
  @ApiOkResponse({ type: StateMachineResponseDto })
  async delete(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.stateMachineService.delete(tenantId, id);
  }

  @Post(':id/execute')
  @CheckAbility({ action: 'create', subject: 'Workflow' })
  @ApiOperation({ summary: 'Execute state machine on an entity' })
  @ApiCreatedResponse({ type: ExecutionInstanceResultDto })
  async execute(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ExecuteStateMachineDto,
  ): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.stateMachineService.execute(
      tenantId,
      userId,
      dto.machine_key,
      dto.entity_type,
      dto.entity_id,
      dto.context,
    );
  }
}
