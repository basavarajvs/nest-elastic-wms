# Phase 12 — Dock/Yard & Storage Billing

**Goal:** Dock appointment scheduling, yard vehicle tracking, storage rate management, inventory snapshots, charge calculation, client invoicing.

**Depends on:** P0, P1 (facilities, clients), P3 (inventory on-hand for snapshots)

---

## Models (13 existing, 1 new table)

### Existing Tables in DB

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | dock_appointments | `dock_appointments` | dock-yard |
| 2 | yard_vehicles | `yard_vehicles` | dock-yard |
| 3 | storage_rate_master | `storage_rate_master` | billing/storage |
| 4 | storage_rates | `storage_rates` | billing/storage |
| 5 | storage_inventory_snapshots | `storage_inventory_snapshots` | billing/storage |
| 6 | storage_charges | `storage_charges` | billing/storage |
| 7 | storage_billing_cycles | `storage_billing_cycles` | billing/storage |
| 8 | charge_calculation_rules | `charge_calculation_rules` | billing/storage |
| 9 | billing_cycles | `billing_cycles` | billing |
| 10 | client_invoices | `client_invoices` | billing/invoicing |
| 11 | client_invoice_lines | `client_invoice_lines` | billing/invoicing |
| 12 | storage_vas_invoices | `storage_vas_invoices` | billing |
| 13 | storage_vas_invoice_lines | `storage_vas_invoice_lines` | billing |

### New Table to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | StorageClientRate | `storage_client_rates` | id(UUID), tenantId(UUID), rateMasterId(UUID), clientId(UUID), ratePerUnit(DECIMAL18,6), rateCurrency(CHAR3), effectiveFrom(DATE), effectiveTo(DATE), createdAt | `storage_client_rates_uq(tenantId,rateMasterId,clientId)` |

**Migration SQL:**
```sql
CREATE TABLE multitenant.storage_client_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rate_master_id UUID,
  client_id UUID,
  rate_per_unit DECIMAL(18,6),
  rate_currency CHAR(3) DEFAULT 'USD',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, rate_master_id, client_id)
);
```

---

## Module Structure

```
src/dock-yard/
├── dock-yard.module.ts
├── dock-yard.service.ts
├── web/
├── rf/
└── dtos/

src/billing/
├── billing.module.ts
├── storage/
│   ├── storage-rate.service.ts
│   ├── snapshot.service.ts
│   ├── charge.service.ts
│   ├── web/
│   └── dtos/
├── invoicing/
│   ├── invoice.service.ts
│   ├── web/
│   └── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Dock Appointments | POST/GET/PATCH | `/web/dock-appointments[/:id]` | DockAppointment |
| Dock Appointments | PATCH | `/web/dock-appointments/:id/check-in` | DockAppointment |
| Dock Appointments | PATCH | `/web/dock-appointments/:id/complete` | DockAppointment |
| Dock Appointments | PATCH | `/web/dock-appointments/:id/cancel` | DockAppointment |
| Yard Vehicles | POST/GET/PATCH | `/web/yard/vehicles[/:id]` | YardVehicle |
| Yard Vehicles | PATCH | `/web/yard/vehicles/:id/assign-dock` | YardVehicle |
| Yard Vehicles | PATCH | `/web/yard/vehicles/:id/depart` | YardVehicle |
| Storage Rates | POST/GET/PATCH | `/web/billing/storage-rates[/:id]` | StorageRateMaster |
| Client Rates | POST/GET/PATCH | `/web/billing/client-rates[/:id]` | StorageClientRate |
| Billing Cycles | POST/GET/PATCH | `/web/billing/cycles[/:id]` | BillingCycle |
| Snapshots | POST/GET | `/web/billing/snapshots` | StorageInventorySnapshot |
| Snapshots | POST | `/web/billing/snapshots/generate` | StorageInventorySnapshot |
| Charges | GET | `/web/billing/charges` | StorageCharge |
| Invoices | POST/GET | `/web/billing/invoices[/:id]` | ClientInvoice |
| Invoices | POST | `/web/billing/invoices/:id/generate` | ClientInvoice |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/dock-appointments/upcoming` | read | List upcoming appointments |

## Storage Billing Flow

1. **Daily snapshot** (cron: 2am): Query `inventory_on_hand` grouped by `(location, product, client)`. Store in `storage_inventory_snapshots`.
2. **Charge calculation** (cron: after snapshot): For each snapshot, look up `StorageRateMaster` → optionally `StorageClientRate` override. Calculate charge = `qty × ratePerUnit × days`. Store in `storage_charges`.
3. **Invoice generation** (on-demand): Group charges by client + billing cycle. Create `client_invoices` + `client_invoice_lines`.

## CASL Subjects to Add

`'DockAppointment' | 'YardVehicle' | 'StorageRateMaster' | 'StorageClientRate' | 'BillingCycle' | 'StorageInventorySnapshot' | 'StorageCharge' | 'ClientInvoice'`

## Tenant Isolation — Add to `hasTenantId()`

All 13 existing + 1 new model.

## Tests

| Test | File |
|------|------|
| Dock appointment lifecycle | `dock-yard/dock-yard.service.spec.ts` |
| Vehicle registration + dock assignment | `dock-yard/dock-yard.service.spec.ts` |
| Storage rate CRUD + client override | `billing/storage/storage-rate.service.spec.ts` |
| Snapshot generation from on-hand | `billing/storage/snapshot.service.spec.ts` |
| Charge calculation logic | `billing/storage/charge.service.spec.ts` |
| Invoice generation | `billing/invoicing/invoice.service.spec.ts` |
