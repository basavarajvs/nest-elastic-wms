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
import { BpmnProcessResponseDto, BpmnExecutionResultDto, CreateBpmnProcessDto, UpdateBpmnProcessDto, StartBpmnProcessDto } from '../dtos/bpmn.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { BpmnService } from '../bpmn.service';

@ApiTags('Workflow - BPMN Processes')
@UseGuards(JwtAuthGuard, CaslGuard)
@Controller('web/workflow/bpmn-processes')
export class BpmnController {
  constructor(private readonly bpmnService: BpmnService) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Workflow' })
  @ApiOperation({ summary: 'Create BPMN process definition' })
  @ApiCreatedResponse({ type: BpmnProcessResponseDto })
  async create(@Req() req: any, @Body() dto: CreateBpmnProcessDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.bpmnService.create(tenantId, userId, dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'List BPMN process definitions' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.bpmnService.findAll(tenantId, query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Workflow' })
  @ApiOperation({ summary: 'Get BPMN process definition by ID' })
  @ApiOkResponse({ type: BpmnProcessResponseDto })
  async findById(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.bpmnService.findById(tenantId, id);
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Workflow' })
  @ApiOperation({ summary: 'Update BPMN process definition' })
  @ApiOkResponse({ type: BpmnProcessResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBpmnProcessDto): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.bpmnService.update(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Workflow' })
  @ApiOperation({ summary: 'Delete BPMN process definition' })
  @ApiOkResponse({ type: BpmnProcessResponseDto })
  async delete(@Req() req: any, @Param('id') id: string): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    return this.bpmnService.delete(tenantId, id);
  }

  @Post(':id/start')
  @CheckAbility({ action: 'create', subject: 'Workflow' })
  @ApiOperation({ summary: 'Start a BPMN process' })
  @ApiCreatedResponse({ type: BpmnExecutionResultDto })
  async start(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: StartBpmnProcessDto,
  ): Promise<any> {
    const tenantId = req.tenantContext.getTenantId();
    const userId = req.user?.sub;
    return this.bpmnService.start(
      tenantId,
      userId,
      dto.process_key,
      dto.context || {},
    );
  }
}
