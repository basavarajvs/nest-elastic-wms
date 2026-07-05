# Phase 4 — Outbound + Carrier Integration

**Goal:** Sales orders, picking, packing, shipping, loads, labels, replenishment, cross-dock, carrier rate shopping.

**Depends on:** P0, P1 (products, clients, facilities, locations), P3 (inventory on-hand, allocations)

---

## Models (21 existing, 1 new table)

### Existing Tables in DB

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | sales_orders | `sales_orders` | outbound/orders |
| 2 | sales_order_lines | `sales_order_lines` | outbound/orders |
| 3 | picking_waves | `picking_waves` | outbound/picking |
| 4 | picking_tasks | `picking_tasks` | outbound/picking |
| 5 | wave_orders | `wave_orders` | outbound/picking |
| 6 | packing_sessions | `packing_sessions` | outbound/packing |
| 7 | packing_containers | `packing_containers` | outbound/packing |
| 8 | packing_session_status_history | `packing_session_status_history` | outbound/packing |
| 9 | packing_materials | `packing_materials` | outbound/packing |
| 10 | packing_slip_items | `packing_slip_items` | outbound/packing |
| 11 | packing_slips | `packing_slips` | outbound/packing |
| 12 | packing_stations | `packing_stations` | outbound/packing |
| 13 | outbound_shipments | `outbound_shipments` | outbound/shipping |
| 14 | outbound_shipment_items | `outbound_shipment_items` | outbound/shipping |
| 15 | shipment_status_history | `shipment_status_history` | outbound/shipping |
| 16 | loads | `loads` | outbound/loads |
| 17 | load_shipments | `load_shipments` | outbound/loads |
| 18 | shipping_labels | `shipping_labels` | outbound/shipping |
| 19 | replenishment_rules | `replenishment_rules` | outbound/replenishment |
| 20 | replenishment_tasks | `replenishment_tasks` | outbound/replenishment |
| 21 | cross_dock_operations | `cross_dock_operations` | outbound/cross-dock |

### New Table to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | CarrierRate | `carrier_rates` | id(UUID), tenantId(UUID), carrierId(UUID), serviceLevel(VARCHAR50), zoneFrom(VARCHAR10), zoneTo(VARCHAR10), weightMin(DECIMAL12,2), weightMax(DECIMAL12,2), baseRate(DECIMAL12,4), ratePerKg(DECIMAL12,6), fuelSurchargePct(DECIMAL5,2), minCharge(DECIMAL12,2), transitDays(INT), effectiveFrom(DATE), effectiveTo(DATE), isActive(BOOL) | `carrier_rates_uq(tenantId,carrierId,zoneFrom,zoneTo,serviceLevel,weightMin,weightMax)`, `idx_carrier_rates_carrier(tenantId,carrierId)` |

**Migration SQL:**
```sql
CREATE TABLE multitenant.carrier_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  carrier_id UUID,
  service_level VARCHAR(50),
  zone_from VARCHAR(10),
  zone_to VARCHAR(10),
  weight_min DECIMAL(12,2) DEFAULT 0,
  weight_max DECIMAL(12,2),
  base_rate DECIMAL(12,4),
  rate_per_kg DECIMAL(12,6),
  fuel_surcharge_pct DECIMAL(5,2),
  min_charge DECIMAL(12,2),
  transit_days INTEGER,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, carrier_id, zone_from, zone_to, service_level, weight_min, weight_max)
);
CREATE INDEX idx_carrier_rates_carrier ON multitenant.carrier_rates(tenant_id, carrier_id);
```

---

## Module Structure

```
src/outbound/
├── outbound.module.ts
├── orders/                    # sales_orders + lines
├── picking/                   # waves + tasks + wave_orders
├── packing/                   # sessions + containers + history + materials + slips + stations
├── shipping/                  # shipments + items + status_history + labels
├── loads/                     # loads + load_shipments
├── replenishment/             # rules + tasks
├── cross-dock/                # operations
├── carrier-rates/             # carrier_rates
├── web/
├── rf/
└── dtos/
```

---

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Orders | POST/GET/PATCH | `/web/sales-orders[/:id]` | SalesOrder |
| Orders | POST | `/web/sales-orders/:id/release` | SalesOrder |
| Orders | GET | `/web/sales-orders/:id/lines` | SalesOrder |
| Waves | POST/GET/PATCH | `/web/picking-waves[/:id]` | PickingWave |
| Waves | POST | `/web/picking-waves/:id/release` | PickingWave |
| Tasks | GET | `/web/picking-tasks` | PickingTask |
| Tasks | PATCH | `/web/picking-tasks/:id/assign` | PickingTask |
| Packing Sessions | POST/GET | `/web/packing-sessions[/:id]` | PackingSession |
| Packing Stations | POST/GET/PATCH | `/web/packing-stations[/:id]` | PackingSession |
| Packing Slips | GET | `/web/packing-slips/:id` | PackingSession |
| Shipments | POST/GET/PATCH | `/web/outbound-shipments[/:id]` | OutboundShipment |
| Shipments | POST | `/web/outbound-shipments/:id/ship` | OutboundShipment |
| Loads | POST/GET/PATCH | `/web/loads[/:id]` | OutboundShipment |
| Loads | POST | `/web/loads/:id/depart` | OutboundShipment |
| Labels | GET | `/web/shipping-labels/:id/print` | OutboundShipment |
| Replenishment Rules | POST/GET/PATCH | `/web/replenishment-rules[/:id]` | Replenishment |
| Replenishment Tasks | GET/PATCH | `/web/replenishment-tasks[/:id]` | Replenishment |
| Cross Dock | POST/GET/PATCH | `/web/cross-dock-operations[/:id]` | OutboundShipment |
| Carrier Rates | POST/GET/PATCH | `/web/carrier-rates[/:id]` | Carrier |
| Carrier Rates | POST | `/web/carrier-rates/shop` | Carrier |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/outbound/pick/next` | pick | Get next pick task |
| `POST /rf/outbound/pick/assign` | pick | Assign picker |
| `POST /rf/outbound/pick/scan-location` | pick | Scan pick-from location |
| `POST /rf/outbound/pick/scan-product` | pick | Scan product barcode |
| `POST /rf/outbound/pick/confirm` | pick | Confirm pick quantity |
| `POST /rf/outbound/pack/start` | pack | Begin packing session |
| `POST /rf/outbound/pack/scan-lpn` | pack | Scan LPN to pack |
| `POST /rf/outbound/pack/seal` | pack | Seal container |
| `POST /rf/outbound/ship/load` | ship | Load shipment onto truck |
| `POST /rf/outbound/ship/dispatch` | ship | Dispatch shipment |

## BullMQ Queues

- `carrier-rate-sync` — periodic rate sync from carrier APIs

## CASL Subjects to Add

`'SalesOrder' | 'PickingWave' | 'PickingTask' | 'PackingSession' | 'PackingContainer' | 'OutboundShipment' | 'Replenishment'`

## Tenant Isolation — Add to `hasTenantId()`

All 21 existing + 1 new model.

## Key Business Logic

### Wave Release
1. Validate all order lines are allocated
2. Create PickingTasks per location (efficient route)
3. Set wave status to RELEASED
4. Notify pickers via event

### Packing Station Workflow
1. Operator checks into station via RF
2. Scans LPN → creates PackingSession
3. Suggests box type from PackingMaterials based on contents
4. Generates PackingSlip with item list
5. On seal: creates PackingContainer, transitions LPN to PACKED

### Carrier Rate Shopping
1. At ship time, query CarrierRate for zone/weight match
2. Return cheapest + fastest options
3. Allow manual override

## Tests

| Test | File |
|------|------|
| SalesOrder lifecycle (create→release→wave) | `orders/order.service.spec.ts` |
| Picking wave creation + task generation | `picking/picking-wave.service.spec.ts` |
| Packing station check-in/out + slip gen | `packing/packing.service.spec.ts` |
| Shipment dispatch flow | `shipping/shipping.service.spec.ts` |
| Carrier rate shopping | `carrier-rates/carrier-rate.service.spec.ts` |
