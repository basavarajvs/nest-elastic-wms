import { SyncResult, InventorySyncDto } from '../dtos/integration.dto';

export interface ProductSyncItem {
  externalId: string;
  sku: string;
  name: string;
  description?: string;
  price?: number;
  barcode?: string;
  category?: string;
  attributes?: Record<string, string>;
  isActive?: boolean;
}

export interface OrderSyncItem {
  externalId: string;
  orderNumber: string;
  status: string;
  customerEmail?: string;
  customerName?: string;
  deliveryAddress?: Record<string, any>;
  lineItems: Array<{
    externalProductId: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export interface IIntegrationAdapter {
  readonly platform: string;

  syncProducts(tenantId: string, since?: Date): Promise<{ items: ProductSyncItem[]; nextSince?: Date }>;
  syncOrders(tenantId: string, orderExternalIds?: string[], since?: Date): Promise<{ items: OrderSyncItem[] }>;
  pushInventory(updates: InventorySyncDto[]): Promise<SyncResult>;
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;
  mapExternalOrderToWmsOrder(externalOrder: OrderSyncItem, tenantId: string): any;
  mapExternalProductToWmsProduct(externalProduct: ProductSyncItem, tenantId: string): any;
}
