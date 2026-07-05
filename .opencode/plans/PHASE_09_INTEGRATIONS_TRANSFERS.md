# Phase 9 — Integrations & Inventory Transfers

**Goal:** Inventory transfers (inter-facility), external platform integrations (Shopify/WooCommerce), webhook system, external entity mapping.

**Depends on:** P0, P1 (products, facilities, clients), P3 (inventory on-hand, lots)

---

## Models (0 existing, 5 new tables)

### New Tables to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | InventoryTransfer | `inventory_transfers` | id(UUID), tenantId(UUID), facilityId(UUID), transferNumber(VARCHAR100), fromLocationId(UUID), toLocationId(UUID), transferType(VARCHAR50), status(ENUM:DRAFT/REQUESTED/DISPATCHED/RECEIVED/CANCELLED), requestedByUserId(UUID), approvedByUserId(UUID), notes(TEXT), createdAt, updatedAt | `inventory_transfers_uq(tenantId,transferNumber)`, `idx_trf_status(tenantId,status)` |
| 2 | InventoryTransferLine | `inventory_transfer_lines` | id(UUID), tenantId(UUID), transferId(UUID FK), productId(UUID), lotId(UUID), uomId(UUID), qtyRequested(DECIMAL12,4), qtyShipped(DECIMAL12,4), qtyReceived(DECIMAL12,4), status(VARCHAR20), createdAt | `idx_trfl_transfer(tenantId,transferId)` |
| 3 | IntegrationSyncLog | `integration_sync_logs` | id(UUID), tenantId(UUID), platform(VARCHAR50), syncType(VARCHAR50), status(VARCHAR20), recordsProcessed(INT), recordsSucceeded(INT), recordsFailed(INT), errorSummary(TEXT), startedAt(TIMESTAMPTZ), completedAt(TIMESTAMPTZ) | `idx_isl_status_time(tenantId,status,startedAt)` |
| 4 | SyncWebhookLog | `sync_webhook_logs` | id(UUID), tenantId(UUID), platform(VARCHAR50), eventType(VARCHAR100), payloadHash(VARCHAR64), payload(JSONB), status(VARCHAR20), processedAt(TIMESTAMPTZ), errorMessage(TEXT) | `swl_dedup_uq(tenantId,platform,payloadHash)`, `idx_swl_received(tenantId,processedAt)` |
| 5 | ExternalEntityMapping | `external_entity_mappings` | id(UUID), tenantId(UUID), platform(VARCHAR50), externalEntityType(VARCHAR50), externalEntityId(VARCHAR255), wmsEntityType(VARCHAR50), wmsEntityId(UUID), syncDirection(VARCHAR20), historicalSku(VARCHAR100), isActive(BOOL), createdAt, updatedAt | `eem_external_uq(tenantId,platform,externalEntityType,externalEntityId)`, `idx_eem_platform_entity(tenantId,platform,externalEntityType)`, `idx_eem_wms_entity(tenantId,wmsEntityType,wmsEntityId)` |

**Migration SQL:**
```sql
-- Inventory Transfers
CREATE TABLE multitenant.inventory_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  facility_id UUID,
  transfer_number VARCHAR(100) NOT NULL,
  from_location_id UUID,
  to_location_id UUID,
  transfer_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'DRAFT',
  requested_by_user_id UUID,
  approved_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, transfer_number)
);
CREATE INDEX idx_trf_status ON multitenant.inventory_transfers(tenant_id, status);

CREATE TABLE multitenant.inventory_transfer_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  transfer_id UUID REFERENCES multitenant.inventory_transfers(id) ON DELETE CASCADE,
  product_id UUID,
  lot_id UUID,
  uom_id UUID,
  qty_requested DECIMAL(12,4),
  qty_shipped DECIMAL(12,4),
  qty_received DECIMAL(12,4),
  status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_trfl_transfer ON multitenant.inventory_transfer_lines(tenant_id, transfer_id);

-- Integration Sync
CREATE TABLE multitenant.integration_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50),
  sync_type VARCHAR(50),
  status VARCHAR(20),
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_summary TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_isl_status_time ON multitenant.integration_sync_logs(tenant_id, status, started_at);

-- Webhook Logs
CREATE TABLE multitenant.sync_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50),
  event_type VARCHAR(100),
  payload_hash VARCHAR(64) NOT NULL,
  payload JSONB,
  status VARCHAR(20),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(tenant_id, platform, payload_hash)
);
CREATE INDEX idx_swl_received ON multitenant.sync_webhook_logs(tenant_id, processed_at);

-- External Entity Mapping
CREATE TABLE multitenant.external_entity_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50),
  external_entity_type VARCHAR(50),
  external_entity_id VARCHAR(255),
  wms_entity_type VARCHAR(50),
  wms_entity_id UUID,
  sync_direction VARCHAR(20),
  historical_sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform, external_entity_type, external_entity_id)
);
CREATE INDEX idx_eem_platform_entity ON multitenant.external_entity_mappings(tenant_id, platform, external_entity_type);
CREATE INDEX idx_eem_wms_entity ON multitenant.external_entity_mappings(tenant_id, wms_entity_type, wms_entity_id);
```

---

## Module Structure

```
src/transfers/
├── transfers.module.ts
├── transfers.service.ts
├── web/
├── rf/
└── dtos/

src/integrations/
├── integrations.module.ts
├── adapters/                  # ShopifyAdapter, WooCommerceAdapter
├── processors/                # Sync processors
├── webhooks/                  # Incoming webhook handler
│   ├── webhook.service.ts
│   ├── webhook-dedup.guard.ts
│   └── dtos/
├── entity-mapping/            # ExternalEntityMapping service
└── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Transfers | POST/GET | `/web/transfers[/:id]` | InventoryTransfer |
| Transfers | POST | `/web/transfers/:id/dispatch` | InventoryTransfer |
| Transfers | POST | `/web/transfers/:id/receive` | InventoryTransfer |
| Transfers | GET | `/web/transfers/:id/lines` | InventoryTransferLine |
| Sync Logs | GET | `/web/integration/sync-logs` | IntegrationSyncLog |
| Webhook Logs | GET | `/web/integration/webhook-logs` | SyncWebhookLog |
| Entity Mappings | POST/GET | `/web/integration/entity-mappings` | ExternalEntityMapping |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/transfers/initiate` | initiateTransfer | Start transfer from RF |
| `POST /rf/transfers/scan-lpn` | initiateTransfer | Scan LPN to add |
| `POST /rf/transfers/complete` | receiveTransfer | Complete transfer receipt |

## CASL Subjects to Add

`'InventoryTransfer' | 'InventoryTransferLine' | 'IntegrationSyncLog' | 'SyncWebhookLog' | 'ExternalEntityMapping' | 'Integration'`

## Tenant Isolation — Add to `hasTenantId()`

All 5 new models.

## Key Business Logic

### Transfer Lifecycle
- DRAFT → REQUESTED → DISPATCHED → RECEIVED → CANCELLED
- On DISPATCH: decrement source facility inventory
- On RECEIVE: increment destination facility inventory

### Webhook Dedup
- `SyncWebhookLog` has `UNIQUE(tenantId, platform, payloadHash)`
- Before processing, check if hash exists → skip if already processed

## Tests

| Test | File |
|------|------|
| Transfer lifecycle + inventory impact | `transfers/transfers.service.spec.ts` |
| Webhook dedup | `integrations/webhooks/webhook.service.spec.ts` |
| External entity mapping CRUD | `integrations/entity-mapping/entity-mapping.service.spec.ts` |
