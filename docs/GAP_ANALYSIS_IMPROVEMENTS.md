# WMS Gap Analysis & Improvement Plan

Based on Reference WMS (warehouse-facility-ops-service, warehouse-inventory-quality-service, warehouse-master-catalog-service, warehouse-order-logistics-service) vs current WMS app.

---

## P0 — Must Have (CRUD gaps blocking basic SaaS operation)

| # | Domain | Gap | Reference Endpoints | Current State | Action |
|---|--------|-----|---------------------|---------------|--------|
| 1 | **Facilities** | Facility CRUD | `POST/GET/PUT/DELETE /api/facilities` | Only `GET web/facilities` and `GET rf/facilities` | Add `create`, `update`, `delete`, `get-by-id` endpoints + service layer + DTOs |
| 2 | **Facilities** | Zone CRUD | `POST/GET/PUT/DELETE /api/warehouse/zones` | Only `GET web/zones` and `GET rf/zones` | Add `create`, `update`, `delete`, `get-by-id` endpoints + service layer + DTOs |
| 3 | **LPN** | Dedicated LPN service | `GET/POST /api/lpns`, `GET /by-number`, `/location`, `/children`, `/hierarchy`, `/move`, `/nest`, `/unnest`, `/status` | LPN used inline in inbound + transfer services only. No dedicated CRUD or nest/move/hierarchy. | Create `LpnService` with CRUD, `getByNumber`, `getByLocation`, `getChildren`, `moveLpn`, `nestLpn`, `unnestLpn`, `updateStatus` |
| 4 | **Inbound** | Purchase Order CRUD | `POST/GET/PUT/DELETE /api/v1/purchase-orders`, `/api/v1/purchaseorderlines` | `poNumber` is a free-text field on ASN/GRN. No `PurchaseOrder` or `PurchaseOrderLine` models. | Create Prisma models + service + controller + DTOs for PO and PO lines |
| 5 | **Inbound** | Customer Returns CRUD | `POST/GET/PUT/DELETE /api/v1/customer-returns`, `/api/v1/customer-return-items` | Not present anywhere. No model, no service, no endpoints. | Create Prisma model + service + controller + DTOs for customer returns |
| 6 | **Outbound** | Load model + CRUD | `POST/GET/PUT/DELETE /api/v1/loads`, `PUT /status/loaded`, `/status/departed` | `loadId` is a free-text `String?` on `OutboundShipment`. No Load model/table exists. | Create Prisma model + service + controller for loads with status transitions |
| 7 | **Outbound** | Carrier CRUD | `POST/GET/PUT/DELETE /api/v1/carriers` | `carrierCode` is free-text on `OutboundShipment`/`PackingContainer`. No Carrier model exists. | Create Prisma model + service + controller + DTOs for carriers |
| 8 | **Products** | Product Brands | `POST/GET/PUT/DELETE /api/v1/product-brands` | Not present anywhere. No model, no service. | Create Prisma model + service + controller + DTOs for product brands |
| 9 | **Products** | Vendor CRUD | `POST/GET/PUT/DELETE /api/v1/vendors`, `/api/v1/vendor-contacts`, `/api/v1/vendor-addresses` | `vendorId` is a free-text `String?` on ASN/GRN. No Vendor model exists. | Create Prisma models + service + controller for vendors, vendor contacts, vendor addresses |
| 10 | **Products** | Client CRUD | `POST/GET/PUT/DELETE /api/v1/clients`, `/api/v1/clientcontacts`, `/api/v1/client-addresses` | `clientCode` is a free-text `String?` on `SalesOrder`. No Client model exists. | Create Prisma models + service + controller for clients, client contacts, client addresses |

## P1 — Important (Operational workflows)

| # | Domain | Gap | Key Reference Endpoints | Current State | Action |
|---|--------|-----|------------------------|---------------|--------|
| 11 | **Inventory** | LPN hierarchy + availability | `GET /api/lpns/available`, `/available-for-shipment`, `/product/{id}/available-quantity` | LPN exists in schema but no availability queries | Add LPN availability queries + enriched endpoints |
| 12 | **Inventory** | Inventory reservations | `POST/GET/DELETE /api/v1/inventoryreservations` | Schema has no `InventoryReservation` model. No reservation logic. | Create model + service |
| 13 | **Outbound** | Shipping labels CRUD | `POST/GET/PUT/DELETE /api/v1/shipping-labels`, `/generate`, `/{id}/print`, `/webhooks/tracking` | `labelUrl` is stored on `OutboundShipment`. No dedicated label model. | Create model + service + controller |
| 14 | **Inbound** | Full GRN lifecycle (arrived/received/inspected/completed) | `POST /goods-receipts/{receiptNumber}/mark-arrived`, `/mark-received`, `/mark-completed`, `start-receiving`, `start-inspection`, `complete-inspection` | GRN exists with status transitions but lacks explicit `mark-*` endpoints | Add explicit status transition endpoints |
| 15 | **Products** | Product Packaging Hierarchy | `POST/GET/PUT/DELETE /api/v1/product-packaging-hierarchies` | Not present. UOM exists but no multi-level packaging (EA→CS→PLT) conversions. | Create model + service |
| 16 | **Products** | Product Suppliers | `POST/GET/PUT/DELETE /api/v1/product-suppliers` | Not present. No vendor-SKU/cost/lead-time tracking per product. | Create model + service |

## P2 — Enhanced Functionality

| # | Domain | Gap | Key Reference Endpoints | Current State | Action |
|---|--------|-----|------------------------|---------------|--------|
| 17 | **Quality** | Non-Conformance Reports | `POST/GET/PUT/DELETE /api/v1/non-conformance-reports` | Not present. QC inspection exists but no NCR workflow. | Create model + service |
| 18 | **Quality** | Exception Management | `POST/GET/PUT/DELETE /api/v1/exception-management` | Not present. No exception tracking. | Create model + service |
| 19 | **Inventory** | Advanced cycle counting (plans + analytics) | `POST /api/v1/cycle-count/plans`, `/tasks`, `GET /api/v1/inventory-counts/analytics/accuracy-report`, `/top-variances` | Cycle counts exist (schedule/execute) but no plans, analytics, or top-variances | Add cycle count plans + analytics endpoints |
| 20 | **Outbound** | VAS Execution | `POST/GET/PUT/DELETE /api/vas-execution-tasks`, `/vas-execution-charges`, `/vas-task-events` | Not present. No VAS (value-added services) workflow. | Create model + service + controller |
| 21 | **Outbound** | Carrier rate shopping + manifest | `POST /api/v1/carriers/rates`, `GET /manifests/{code}/status`, `POST /manifests/{code}/close` | Not present. Shipping has basic manifest generation. | Add rate shopping + manifest lifecycle |
| 22 | **Inventory** | Inventory lot service | CRUD `/api/inventory/lots` | Lot is used ad-hoc in RF controller. No dedicated service. | Extract `InventoryLotService` |
| 23 | **Products** | ProductClientAssignment | `POST/GET/PUT/DELETE /api/v1/product-client-assignments` | Not present. | Create model + service |
| 24 | **Facilities** | Loading docks CRUD | `POST/GET/PUT/DELETE /api/v1/loading-docks` | Not present. | Create model + service |
| 25 | **Facilities** | Packing stations CRUD | `POST/GET/PUT/DELETE /api/v1/packing-stations` | `stationCode` is a string on `PackingSession`. No dedicated model. | Create model + service |

---

## Implementation Sequence

Phase 1 (P0 items — must have for SaaS operations):
1. Facility CRUD (P0.1)
2. Zone CRUD (P0.2)
3. LPN service (P0.3)
4. Purchase Order CRUD (P0.4)
5. Customer Returns CRUD (P0.5)
6. Load model + CRUD (P0.6)
7. Carrier CRUD (P0.7)
8. Product Brands (P0.8)
9. Vendor CRUD (P0.9)
10. Client CRUD (P0.10)

Phase 2 (P1 items — operational workflows):
11–16 as listed above

Phase 3 (P2 items — enhanced functionality):
17–25 as listed above
