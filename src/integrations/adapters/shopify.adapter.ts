import { Injectable, Logger } from '@nestjs/common';
import { IIntegrationAdapter, ProductSyncItem, OrderSyncItem } from './integration-adapter.interface';
import { InventorySyncDto, SyncResult } from '../dtos/integration.dto';
import { TokenBucketRateLimiter } from '../../common/rate-limiter/token-bucket.rate-limiter';
import { CoreIntegrationClientService } from '../core-integration-client.service';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

const SHOPIFY_STATUS_MAP: Record<string, string> = {
  pending: 'CREATED',
  paid: 'VALIDATED',
  partially_fulfilled: 'PICKED',
  fulfilled: 'SHIPPED',
  refunded: 'CANCELLED',
  cancelled: 'CANCELLED',
};

@Injectable()
export class ShopifyAdapter implements IIntegrationAdapter {
  readonly platform = 'SHOPIFY';
  private readonly logger = new Logger(ShopifyAdapter.name);
  private readonly http: AxiosInstance;
  private readonly webhookSecret: string;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly coreIntegration: CoreIntegrationClientService;
  private readonly tenantId: string;

  constructor(
    shopDomain: string,
    accessToken: string,
    webhookSecret: string,
    rateLimiter: TokenBucketRateLimiter,
    coreIntegration: CoreIntegrationClientService,
    tenantId: string,
  ) {
    this.http = axios.create({
      baseURL: `https://${shopDomain}/admin/api/2024-01`,
      headers: { 'X-Shopify-Access-Token': accessToken },
      timeout: 15000,
    });
    this.webhookSecret = webhookSecret;
    this.rateLimiter = rateLimiter;
    this.coreIntegration = coreIntegration;
    this.tenantId = tenantId;
  }

  async syncProducts(tenantId: string, since?: Date): Promise<{ items: ProductSyncItem[]; nextSince?: Date }> {
    await this.waitForCapacity();
    const params: any = { limit: 250 };
    if (since) params.updated_at_min = since.toISOString();

    const { data } = await this.http.get('/products.json', { params });
    this.trackApiCall('products.read');

    const items: ProductSyncItem[] = (data.products || []).map((p: any) => ({
      externalId: String(p.id),
      sku: p.variants?.[0]?.sku || '',
      name: p.title,
      description: p.body_html ? p.body_html.replace(/<[^>]+>/g, '') : undefined,
      price: parseFloat(p.variants?.[0]?.price || '0'),
      barcode: p.variants?.[0]?.barcode || undefined,
      category: p.product_type || undefined,
      attributes: { vendor: p.vendor || '', tags: (p.tags || '').split(', ') },
      isActive: p.status === 'active',
    }));

    return { items, nextSince: items.length > 0 ? new Date() : undefined };
  }

  async syncOrders(tenantId: string, orderExternalIds?: string[], since?: Date): Promise<{ items: OrderSyncItem[] }> {
    await this.waitForCapacity();
    const params: any = { limit: 250, status: 'any' };
    if (since) params.updated_at_min = since.toISOString();
    if (orderExternalIds?.length) params.ids = orderExternalIds.join(',');

    const { data } = await this.http.get('/orders.json', { params });
    this.trackApiCall('orders.read');

    const items: OrderSyncItem[] = (data.orders || []).map((o: any) => ({
      externalId: String(o.id),
      orderNumber: String(o.name),
      status: o.financial_status || 'pending',
      customerEmail: o.email || undefined,
      customerName: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : undefined,
      deliveryAddress: o.shipping_address || undefined,
      lineItems: (o.line_items || []).map((li: any) => ({
        externalProductId: String(li.product_id),
        sku: li.sku || '',
        quantity: li.quantity || 0,
        price: parseFloat(li.price || '0'),
      })),
      createdAt: o.created_at,
    }));

    return { items };
  }

  async pushInventory(updates: InventorySyncDto[]): Promise<SyncResult> {
    const errors: string[] = [];
    let succeeded = 0;

    for (const u of updates) {
      await this.waitForCapacity();
      try {
        await this.http.post('/inventory_levels/set.json', {
          location_id: u.facilityId,
          inventory_item_id: u.externalVariantId,
          available: Math.max(0, Math.floor(u.quantity)),
        });
        this.trackApiCall('inventory.write');
        succeeded++;
      } catch (err: any) {
        errors.push(`Variant ${u.externalVariantId}: ${err.message}`);
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
    const hmac = headers['x-shopify-hmac-sha256'];
    if (!hmac) return false;

    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
  }

  mapExternalOrderToWmsOrder(externalOrder: OrderSyncItem, tenantId: string): any {
    const wmsStatus = SHOPIFY_STATUS_MAP[externalOrder.status] || 'CREATED';
    return {
      tenantId,
      orderNumber: externalOrder.orderNumber,
      clientCode: externalOrder.customerEmail || 'shopify-import',
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
      productCode: externalProduct.sku || `SHOP-${externalProduct.externalId}`,
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
      const allowed = await this.rateLimiter.consume(`SHOPIFY:${this.tenantId}`);
      if (allowed) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('Rate limit timeout — Shopify API capacity exhausted');
  }

  private trackApiCall(operation: string): void {
    this.coreIntegration.reportUsageMetrics(this.tenantId, {
      [`integration_api_calls:${operation}`]: 1,
    }).catch(() => {});
  }
}
