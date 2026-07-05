# Phase 8 — Work Orders & Exception Management

**Goal:** Work order creation/release/complete, operation tracking, component requirements, exception reporting with comments and escalation rules.

**Depends on:** P0, P1 (products, facilities, locations), P3 (inventory for components)

---

## Models (6 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | work_orders | `work_orders` | work-orders |
| 2 | work_order_operations | `work_order_operations` | work-orders |
| 3 | work_order_components | `work_order_components` | work-orders |
| 4 | exception_management | `exception_management` | exceptions |
| 5 | exception_comments | `exception_comments` | exceptions |
| 6 | exception_escalation_rules | `exception_escalation_rules` | exceptions |

---

## Module Structure

```
src/work-orders/
├── work-orders.module.ts
├── work-orders.service.ts
├── operations.service.ts
├── components.service.ts
├── web/
├── rf/
└── dtos/

src/exceptions/
├── exceptions.module.ts
├── exception-management.service.ts
├── exception-comment.service.ts
├── exception-escalation.service.ts
├── web/
├── rf/
└── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Work Orders | POST/GET/PATCH | `/web/work-orders[/:id]` | WorkOrder |
| Work Orders | POST | `/web/work-orders/:id/release` | WorkOrder |
| Work Orders | POST | `/web/work-orders/:id/complete` | WorkOrder |
| Work Orders | POST | `/web/work-orders/:id/cancel` | WorkOrder |
| Operations | POST/GET/PATCH | `/web/work-orders/:id/operations` | WorkOrderOperation |
| Components | POST/GET | `/web/work-orders/:id/components` | WorkOrderComponent |
| Exceptions | POST/GET/PATCH | `/web/exceptions[/:id]` | ExceptionManagement |
| Exceptions | POST | `/web/exceptions/:id/acknowledge` | ExceptionManagement |
| Exceptions | POST | `/web/exceptions/:id/resolve` | ExceptionManagement |
| Comments | POST/GET | `/web/exceptions/:id/comments` | ExceptionComment |
| Escalation Rules | POST/GET/PATCH | `/web/escalation-rules[/:id]` | ExceptionEscalationRule |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/work-orders/my-tasks` | read | List assigned work order operations |
| `POST /rf/work-orders/:id/start-operation` | update | Start an operation |
| `POST /rf/work-orders/:id/complete-operation` | update | Complete an operation |
| `POST /rf/exceptions/report` | create | Report an exception from RF |

## Exception Severity Hierarchy

`LOW < MEDIUM < HIGH < CRITICAL`

## Exception Status Lifecycle

`OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`

## Escalation Engine

`ExceptionEscalationRule` defines: if `exceptionType` matches AND severity >= `severityMinimum` AND elapsed hours >= `unresolvedHours` → notify `escalateToUserId`.

Check should run as a scheduled cron job (every 5 minutes).

## Exception Numbering

Auto-generate: `EXC-{FACILITY_PREFIX}-{SEQUENCE}`

## CASL Subjects to Add

`'WorkOrder' | 'WorkOrderOperation' | 'WorkOrderComponent' | 'ExceptionManagement' | 'ExceptionComment' | 'ExceptionEscalationRule'`

## Tenant Isolation — Add to `hasTenantId()`

All 6 models.

## Tests

| Test | File |
|------|------|
| Work order lifecycle (create→release→complete) | `work-orders/work-orders.service.spec.ts` |
| Operation start/complete transitions | `work-orders/operations.service.spec.ts` |
| Component reservation on release | `work-orders/components.service.spec.ts` |
| Exception CRUD + status transitions | `exceptions/exception-management.service.spec.ts` |
| Escalation rule evaluation | `exceptions/exception-escalation.service.spec.ts` |
