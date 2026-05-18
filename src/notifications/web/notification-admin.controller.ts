import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreClientService } from '../../core-client/core-client.service';
import { WmsNotificationClientService } from '../wms-notification-client.service';
import { ComplianceNotificationGuard } from '../guards/compliance-notification.guard';
import { NotificationAuditStreamerService } from '../notification-audit-streamer.service';

@ApiTags('WMS-WEB')
@Controller('/api/v1/wms/web/notifications')
export class NotificationAdminController {
  constructor(
    private readonly client: WmsNotificationClientService,
    private readonly complianceGuard: ComplianceNotificationGuard,
    private readonly auditStreamer: NotificationAuditStreamerService,
    private readonly coreClient: CoreClientService,
    private readonly configService: ConfigService,
  ) {}

  @Get('logs')
  async getLogs(
    @Query('tenantId') tenantId: string,
  ) {
    return this.client.getAuditLog(tenantId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTest(
    @Body() dto: {
      tenantId: string;
      type: string;
    },
  ) {
    const coreReachable = await this.coreClient.healthCheck();
    if (!coreReachable) {
      throw new ServiceUnavailableException('Core API is not reachable');
    }

    await this.client.dispatch({
      type: dto.type,
      tenantId: dto.tenantId,
      recipients: [],
      variables: {
        productCode: 'TEST-001',
        currentQty: 10,
        reorderPoint: 5,
        locationCode: 'A-01-01',
        orderNumber: 'ORD-TEST',
        clientCode: 'TEST',
        status: 'TEST',
        itemsCount: 1,
        totalValue: 0,
        asnNumber: 'ASN-TEST',
        supplierName: 'Test Supplier',
        expectedDate: new Date().toISOString(),
        itemCount: 1,
        grnNumber: 'GRN-TEST',
        receivedQty: 0,
        putawayQueueCount: 0,
        supplierLotNumber: '',
        defectCode: '',
        qtyRejected: 0,
        countNumber: 'CT-TEST',
        systemQuantity: 10,
        countedQuantity: 10,
        variancePercentage: 0,
        sessionId: '',
        userId: '',
        workflow: '',
        idleMinutes: 0,
        hadTask: false,
        resourceType: 'test',
        usagePercent: 0,
        limitAmount: 0,
        currentUsage: 0,
        date: new Date().toISOString().split('T')[0],
        ordersShipped: 0,
        receiptsProcessed: 0,
        picksCompleted: 0,
        cycleCountsDone: 0,
        accuracyRate: 0,
      },
      priority: 'low',
    });

    return { sent: true };
  }

  @Get('compliance-overrides')
  async getComplianceOverrides(
    @Query('tenantId') tenantId: string,
  ) {
    return this.complianceGuard.getOverrideLog(tenantId);
  }

  @Get('preferences')
  async getPreferencesProxy(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId: string,
  ) {
    const coreUrl = this.configService.get<string>('CORE_API_URL');
    const token = this.configService.get<string>('CORE_API_TOKEN');
    try {
      const { default: axios } = await import('axios');
      const res = await axios.get(
        `${coreUrl}/notification-preferences`,
        {
          headers: {
            'X-System-Token': token,
            'x-tenant-id': tenantId,
          },
          params: { tenantId },
          timeout: 5000,
        },
      );
      return res.data;
    } catch {
      return { preferences: [] };
    }
  }
}
