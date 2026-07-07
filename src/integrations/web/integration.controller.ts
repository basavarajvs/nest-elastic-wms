import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../common/guards/casl.guard';
import { CheckAbility } from '../../common/decorators/check-ability.decorator';
import { WmsAction } from '../../casl/casl.types';
import { WebhookService } from '../webhooks/webhook.service';
import { EntityMappingService } from '../entity-mapping/entity-mapping.service';
import { SyncLogService } from '../sync-logs/sync-log.service';
import {
  WebhookProcessResultDto,
  WebhookLogListResponseDto,
  ExternalEntityMappingDto,
  EntityMappingListResponseDto,
  SyncLogListResponseDto,
  CreateEntityMappingDto,
} from '../dtos/integration-response.dto';
import { DeleteResultDto } from '../../common/dto/paginated-response.dto';

@ApiTags('Integrations')
@Controller('web/integration')
@UseGuards(JwtAuthGuard, CaslGuard)
export class IntegrationWebController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly entityMappingService: EntityMappingService,
    private readonly syncLogService: SyncLogService,
  ) {}

  @Post('webhooks/:platform/:event')
  @CheckAbility({ action: WmsAction.Create, subject: 'Webhook' })
  @ApiOperation({ summary: 'Receive webhook' })
  @ApiCreatedResponse({ type: WebhookProcessResultDto })
  async receiveWebhook(@Req() req: any, @Param('platform') platform: string, @Param('event') event: string, @Body() payload: Record<string, any>) {
    const tenantId = req.tenantContext.getTenantId();
    return this.webhookService.processWebhook(tenantId, platform, event, payload);
  }

  @Get('webhook-logs')
  @CheckAbility({ action: WmsAction.List, subject: 'Webhook' })
  @ApiOperation({ summary: 'List webhook logs' })
  @ApiOkResponse({ type: WebhookLogListResponseDto })
  async getWebhookLogs(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.webhookService.findAll(tenantId, query);
  }

  @Post('entity-mappings')
  @CheckAbility({ action: WmsAction.Create, subject: 'EntityMapping' })
  @ApiOperation({ summary: 'Create entity mapping' })
  @ApiCreatedResponse({ type: ExternalEntityMappingDto })
  async createMapping(@Req() req: any, @Body() dto: CreateEntityMappingDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.entityMappingService.create(tenantId, dto);
  }

  @Get('entity-mappings')
  @CheckAbility({ action: WmsAction.List, subject: 'EntityMapping' })
  @ApiOperation({ summary: 'List entity mappings' })
  @ApiOkResponse({ type: EntityMappingListResponseDto })
  async listMappings(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.entityMappingService.findAll(tenantId, query);
  }

  @Get('entity-mappings/:id')
  @CheckAbility({ action: WmsAction.Read, subject: 'EntityMapping' })
  @ApiOperation({ summary: 'Get entity mapping by external IDs' })
  @ApiOkResponse({ type: ExternalEntityMappingDto })
  async getMapping(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.entityMappingService.findByExternal(tenantId, id.split(':')[0], id.split(':')[1], id.split(':')[2]);
  }

  @Delete('sync-logs/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'SyncLog' })
  @ApiOperation({ summary: 'Delete sync log' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteSyncLog(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.syncLogService.delete(tenantId, id);
  }

  @Delete('entity-mappings/:id')
  @CheckAbility({ action: WmsAction.Delete, subject: 'EntityMapping' })
  @ApiOperation({ summary: 'Delete entity mapping' })
  @ApiOkResponse({ type: DeleteResultDto })
  async deleteMapping(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.entityMappingService.delete(tenantId, id);
  }

  @Get('sync-logs')
  @CheckAbility({ action: WmsAction.List, subject: 'SyncLog' })
  @ApiOperation({ summary: 'List sync logs' })
  @ApiOkResponse({ type: SyncLogListResponseDto })
  async getSyncLogs(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.syncLogService.findAll(tenantId, query);
  }
}
