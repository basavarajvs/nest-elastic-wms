import { Injectable, Logger } from '@nestjs/common';
import { IIntegrationAdapter, ProductSyncItem, OrderSyncItem } from './integration-adapter.interface';
import { InventorySyncDto, SyncResult } from '../dtos/integration.dto';
import { TokenBucketRateLimiter } from '../../common/rate-limiter/token-bucket.rate-limiter';
import { CoreIntegrationClientService } from '../core-integration-client.service';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

const WOOCOMMERCE_STATUS_MAP: Record<string, string> = {
  pending: 'CREATED',
  processing: 'RELEASED',
  'on-hold': 'ON_HOLD',
  completed: 'SHIPPED',
  cancelled: 'CANCELLED',
  refunded: 'CANCELLED',
  failed: 'CANCELLED',
  'checkout-draft': 'CREATED',
};

@Injectable()
export class WooCommerceAdapter implements IIntegrationAdapter {
  readonly platform = 'WOOCOMMERCE';
  private readonly logger = new Logger(WooCommerceAdapter.name);
  private readonly http: AxiosInstance;
  private readonly webhookSecret: string;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly coreIntegration: CoreIntegrationClientService;
  private readonly tenantId: string;

  constructor(
    baseUrl: string,
    consumerKey: string,
    consumerSecret: string,
    webhookSecret: string,
    rateLimiter: TokenBucketRateLimiter,
    coreIntegration: CoreIntegrationClientService,
    tenantId: string,
  ) {
    this.http = axios.create({
      baseURL: `${baseUrl}/wp-json/wc/v3`,
      auth: { username: consumerKey, password: consumerSecret },
      timeout: 15000,
    });
    this.webhookSecret = webhookSecret;
    this.rateLimiter = rateLimiter;
    this.coreIntegration = coreIntegration;
    this.tenantId = tenantId;
  }

  async syncProducts(tenantId: string, since?: Date): Promise<{ items: ProductSyncItem[]; nextSince?: Date }> {
    await this.waitForCapacity();
    const params: any = { per_page: 100 };
    if (since) params.after = since.toISOString();

    const { data } = await this.http.get('/products', { params });
    this.trackApiCall('products.read');

    const items: ProductSyncItem[] = (data || []).map((p: any) => ({
      externalId: String(p.id),
      sku: p.sku || '',
      name: p.name,
      description: p.description ? p.description.replace(/<[^>]+>/g, '') : undefined,
      price: parseFloat(p.price || '0'),
      barcode: p.meta_data?.find((m: any) => m.key === 'barcode')?.value || undefined,
      category: p.categories?.[0]?.name || undefined,
      attributes: { ...(p.attributes || []).reduce((acc: any, a: any) => { acc[a.name] = a.option; return acc; }, {}) },
      isActive: p.status === 'publish',
    }));

    return { items, nextSince: items.length > 0 ? new Date() : undefined };
  }

  async syncOrders(tenantId: string, orderExternalIds?: string[], since?: Date): Promise<{ items: OrderSyncItem[] }> {
    await this.waitForCapacity();
    const params: any = { per_page: 100 };
    if (since) params.after = since.toISOString();
    if (orderExternalIds?.length) params.include = orderExternalIds.join(',');

    const { data } = await this.http.get('/orders', { params });
    this.trackApiCall('orders.read');

    const items: OrderSyncItem[] = (data || []).map((o: any) => ({
      externalId: String(o.id),
      orderNumber: String(o.number),
      status: o.status || 'pending',
      customerEmail: o.billing?.email || undefined,
      customerName: o.billing ? `${o.billing.first_name || ''} ${o.billing.last_name || ''}`.trim() : undefined,
      deliveryAddress: o.shipping || undefined,
      lineItems: (o.line_items || []).map((li: any) => ({
        externalProductId: String(li.product_id),
        sku: li.sku || '',
        quantity: li.quantity || 0,
        price: parseFloat(li.price || '0'),
      })),
      createdAt: o.date_created,
    }));

    return { items };
  }

  async pushInventory(updates: InventorySyncDto[]): Promise<SyncResult> {
    const errors: string[] = [];
    let succeeded = 0;

    for (const u of updates) {
      await this.waitForCapacity();
      try {
        await this.http.put(`/products/${u.externalVariantId}`, {
          stock_quantity: Math.max(0, Math.floor(u.quantity)),
        });
        this.trackApiCall('inventory.write');
        succeeded++;
      } catch (err: any) {
        errors.push(`Product ${u.externalVariantId}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: updates.length,
      recordsSucceeded: succeeded,
      recordsFailed: errors.length,
      errors,
    };
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const signature = headers['x-wc-webhook-signature'];
    if (!signature) return false;

    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }

  mapExternalOrderToWmsOrder(externalOrder: OrderSyncItem, tenantId: string): any {
    const wmsStatus = WOOCOMMERCE_STATUS_MAP[externalOrder.status] || 'CREATED';
    return {
      tenantId,
      orderNumber: externalOrder.orderNumber,
      clientCode: externalOrder.customerEmail || 'woocommerce-import',
      status: wmsStatus,
      deliveryAddress: externalOrder.deliveryAddress || undefined,
      lines: externalOrder.lineItems.map((li) => ({
        externalProductId: li.externalProductId,
        sku: li.sku,
        requestedQuantity: li.quantity,
        price: li.price,
      })),
    };
  }

  mapExternalProductToWmsProduct(externalProduct: ProductSyncItem, tenantId: string): any {
    return {
      tenantId,
      productCode: externalProduct.sku || `WC-${externalProduct.externalId}`,
      name: externalProduct.name,
      description: externalProduct.description,
      isActive: externalProduct.isActive ?? true,
      trackLot: false,
      trackSerial: false,
      externalId: externalProduct.externalId,
      barcode: externalProduct.barcode,
      attributes: externalProduct.attributes,
    };
  }

  private async waitForCapacity(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      const allowed = await this.rateLimiter.consume(`WOOCOMMERCE:${this.tenantId}`);
      if (allowed) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Rate limit timeout — WooCommerce API capacity exhausted');
  }

  private trackApiCall(operation: string): void {
    this.coreIntegration.reportUsageMetrics(this.tenantId, {
      [`integration_api_calls:${operation}`]: 1,
    }).catch(() => {});
  }
}
