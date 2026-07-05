# Phase 6 — VAS (Value-Added Services)

**Goal:** Service catalog, client rates, workstations, execution tracking, VAS billing.

**Depends on:** P0, P1 (products, clients, facilities), P4 (outbound for VAS task references)

---

## Models (8 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | vas_services | `vas_services` | outbound/vas-catalog |
| 2 | vas_service_catalog | `vas_service_catalog` | outbound/vas-catalog |
| 3 | vas_service_client_rates | `vas_service_client_rates` | outbound/vas-catalog |
| 4 | vas_workstations | `vas_workstations` | outbound/vas-catalog |
| 5 | vas_execution_tasks | `vas_execution_tasks` | outbound/vas-execution |
| 6 | vas_execution_charges | `vas_execution_charges` | outbound/vas-execution |
| 7 | vas_transactions | `vas_transactions` | outbound/vas-execution |
| 8 | vas_task_events | `vas_task_events` | outbound/vas-execution |

---

## Module Structure

```
src/outbound/
├── vas-catalog/
│   ├── vas-catalog.module.ts
│   ├── vas-catalog.service.ts
│   ├── web/vas-catalog.controller.ts
│   └── dtos/
├── vas-execution/
│   ├── vas-execution.module.ts
│   ├── vas-execution.service.ts
│   ├── web/vas-execution.controller.ts
│   ├── rf/vas-execution.controller.ts
│   └── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Services | POST/GET/PATCH | `/web/vas/services[/:id]` | VasServiceCatalog |
| Client Rates | POST/GET/PATCH | `/web/vas/client-rates[/:id]` | VasServiceCatalog |
| Workstations | POST/GET/PATCH | `/web/vas/workstations[/:id]` | VasWorkstation |
| Tasks | POST/GET/PATCH | `/web/vas/tasks[/:id]` | VasServiceCatalog |
| Tasks | POST | `/web/vas/tasks/:id/start` | VasServiceCatalog |
| Tasks | POST | `/web/vas/tasks/:id/complete` | VasServiceCatalog |
| Charges | GET | `/web/vas/charges` (filterable) | VasServiceCatalog |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/vas/workstations` | read | List available workstations |
| `POST /rf/vas/workstations/:id/check-in` | create | Check into workstation |
| `POST /rf/vas/workstations/:id/check-out` | delete | Check out of workstation |

## VAS Billing Logic

On VAS task creation, service validates against `vas_service_catalog`:
1. Look up `vas_service_client_rates` by `(serviceId, clientId)`
2. If found, use client-specific rate; else fallback to `vas_services.defaultRate`
3. Populate `ratePerUnit` and `totalCharge` on `vas_execution_tasks`

## CASL Subjects to Add

`'VasServiceCatalog' | 'VasWorkstation'`

## Tenant Isolation — Add to `hasTenantId()`

All 8 models.

## Tests

| Test | File |
|------|------|
| Service catalog CRUD | `vas-catalog/vas-catalog.service.spec.ts` |
| Client rate lookup + fallback | `vas-catalog/vas-catalog.service.spec.ts` |
| Workstation check-in/out | `vas-catalog/vas-catalog.service.spec.ts` |
| VAS execution task lifecycle | `vas-execution/vas-execution.service.spec.ts` |
