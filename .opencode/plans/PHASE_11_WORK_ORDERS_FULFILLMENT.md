# Phase 11 — Fulfillment Workflow

**Goal:** Fulfillment workflow definitions/executions, workflow events/transitions, fulfillment billing runs.

**Depends on:** P0, P4 (outbound — fulfillment wraps order lifecycle)

---

## Models (7 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | fulfillment_workflow_definitions | `fulfillment_workflow_definitions` | fulfillment |
| 2 | fulfillment_workflow_executions | `fulfillment_workflow_executions` | fulfillment |
| 3 | fulfillment_workflow_events | `fulfillment_workflow_events` | fulfillment |
| 4 | fulfillment_workflow_transitions | `fulfillment_workflow_transitions` | fulfillment |
| 5 | fulfillment_billing_runs | `fulfillment_billing_runs` | fulfillment |
| 6 | fulfillment_billing_events | `fulfillment_billing_events` | fulfillment |
| 7 | fulfillment_billing_run_events | `fulfillment_billing_run_events` | fulfillment |

---

## Module Structure

```
src/fulfillment/
├── fulfillment.module.ts
├── fulfillment-workflow.service.ts
├── fulfillment-billing.service.ts
├── web/
└── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Workflow Definitions | POST/GET/PATCH | `/web/fulfillment/workflow-definitions[/:id]` | FulfillmentWorkflowEvent |
| Workflow Executions | GET | `/web/fulfillment/executions` | FulfillmentWorkflowEvent |
| Workflow Events | GET | `/web/workflows/instances/:id/events` | FulfillmentWorkflowEvent |
| Workflow Transitions | GET | `/web/workflows/instances/:id/transitions` | FulfillmentWorkflowTransition |
| Billing Runs | POST/GET | `/web/fulfillment-billing/runs[/:id]` | FulfillmentBillingRun |

## Key Logic

- `FulfillmentWorkflowService` records events + transitions during fulfillment lifecycle
- `FulfillmentBillingService` manages billing runs with auto-numbering
- Workflow events are created when sales orders progress through pick→pack→ship

## CASL Subjects to Add

`'FulfillmentWorkflowEvent' | 'FulfillmentWorkflowTransition' | 'FulfillmentBillingRun' | 'FulfillmentBillingEvent'`

## Tenant Isolation — Add to `hasTenantId()`

All 7 models.

## Tests

| Test | File |
|------|------|
| Workflow event recording | `fulfillment/fulfillment-workflow.service.spec.ts` |
| Billing run lifecycle | `fulfillment/fulfillment-billing.service.spec.ts` |
