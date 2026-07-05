# Phase 2 — Inbound

**Goal:** Purchase orders, advance ship notices, goods receiving, putaway, customer returns.

**Depends on:** P0, P1 (products, vendors, facilities, locations)

---

## Models (14 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | purchase_orders | `purchase_orders` | inbound/purchase-orders |
| 2 | purchase_order_lines | `purchase_order_lines` | inbound/purchase-orders |
| 3 | advance_ship_notices | `advance_ship_notices` | inbound/asn |
| 4 | asn_lines | `asn_lines` | inbound/asn |
| 5 | asn_import_documents | `asn_import_documents` | inbound/asn |
| 6 | asn_import_jobs | `asn_import_jobs` | inbound/asn |
| 7 | asn_import_results | `asn_import_results` | inbound/asn |
| 8 | goods_receipts | `goods_receipts` | inbound/receiving |
| 9 | goods_receipt_lines | `goods_receipt_lines` | inbound/receiving |
| 10 | goods_receipt_items | `goods_receipt_items` | inbound/receiving |
| 11 | putaway_rules | `putaway_rules` | inbound/putaway |
| 12 | putaway_tasks | `putaway_tasks` | inbound/putaway |
| 13 | customer_returns | `customer_returns` | inbound/returns |
| 14 | customer_return_items | `customer_return_items` | inbound/returns |

---

## Module Structure

```
src/inbound/
├── inbound.module.ts
├── purchase-orders/
│   ├── purchase-order.service.ts
│   ├── web/purchase-order.controller.ts
│   ├── rf/purchase-order.controller.ts
│   └── dtos/
├── asn/
│   ├── asn.service.ts
│   ├── asn-import.service.ts
│   ├── asn-import.processor.ts
│   ├── web/asn.controller.ts
│   └── dtos/
├── receiving/
│   ├── receiving.service.ts
│   ├── web/receiving.controller.ts
│   ├── rf/receiving.controller.ts
│   └── dtos/
├── putaway/
│   ├── putaway.service.ts
│   ├── putaway-rule.service.ts
│   ├── web/putaway.controller.ts
│   ├── rf/putaway.controller.ts
│   └── dtos/
└── returns/
    ├── returns.service.ts
    ├── web/returns.controller.ts
    ├── rf/returns.controller.ts
    └── dtos/
```

---

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Purchase Orders | POST/GET | `/web/purchase-orders[/:id]` | PurchaseOrder |
| Purchase Orders | PATCH | `/web/purchase-orders/:id/status` | PurchaseOrder |
| Purchase Orders | GET | `/web/purchase-orders/:id/lines` | PurchaseOrder |
| ASN | POST/GET/PATCH | `/web/advance-ship-notices[/:id]` | AdvanceShipNotice |
| ASN | POST | `/web/advance-ship-notices/import` | AdvanceShipNotice |
| ASN | GET | `/web/advance-ship-notices/:id/lines` | AdvanceShipNotice |
| Goods Receipt | POST/GET | `/web/goods-receipts[/:id]` | GoodsReceipt |
| Goods Receipt | POST | `/web/goods-receipts/:id/receive-line` | GoodsReceipt |
| Goods Receipt | POST | `/web/goods-receipts/:id/complete` | GoodsReceipt |
| Putaway | GET | `/web/putaway-tasks` | PutawayTask |
| Putaway | PATCH | `/web/putaway-tasks/:id/assign` | PutawayTask |
| Putaway | PATCH | `/web/putaway-tasks/:id/complete` | PutawayTask |
| Putaway Rules | POST/GET/PATCH | `/web/putaway-rules[/:id]` | PutawayTask |
| Returns | POST/GET | `/web/customer-returns[/:id]` | PurchaseOrder |
| Returns | POST | `/web/customer-returns/:id/receive` | PurchaseOrder |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/inbound/receive/start` | receive | Start receiving a PO/ASN |
| `POST /rf/inbound/receive/scan` | receive | Scan product/LPN |
| `POST /rf/inbound/receive/confirm` | receive | Confirm qty received |
| `POST /rf/inbound/receive/complete` | receive | Complete receiving session |
| `POST /rf/inbound/putaway/confirm` | executePutaway | Confirm putaway placement |

## BullMQ Queues

- `asn-import` — processes uploaded ASN files (CSV/Excel/EDI)

## CASL Subjects to Add

`'PurchaseOrder' | 'AdvanceShipNotice' | 'GoodsReceipt' | 'PutawayTask'`

## Tenant Isolation — Add to `hasTenantId()`

All 14 models.

## Tests

| Test | File |
|------|------|
| PurchaseOrderService CRUD | `purchase-orders/purchase-order.service.spec.ts` |
| ReceivingService receive flow | `receiving/receiving.service.spec.ts` |
| PutawayService assignment | `putaway/putaway.service.spec.ts` |
| ASN import pipeline | `asn/asn-import.service.spec.ts` |
