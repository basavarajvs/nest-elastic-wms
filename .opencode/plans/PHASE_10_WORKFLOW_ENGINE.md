# Phase 10 — Workflow & Rule Engine

**Goal:** Triple-engine orchestration (XState v5 + Zen DMN + BPMN 2.0) with WorkflowOrchestratorService.

**Depends on:** P0 (RedisModule for caching, BullModule for recovery jobs)

---

## Models (0 existing, 4 new tables)

### New Tables to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | WmsStateMachine | `wms_state_machines` | id(UUID), tenantId(UUID), machineKey(VARCHAR100), version(INT), definitionJson(JSONB), entityType(VARCHAR50), isActive(BOOL), createdAt(TIMESTAMPTZ), updatedAt(TIMESTAMPTZ) | `uq_wsm_tenant_key_version(tenantId,machineKey,version)`, `idx_wsm_entity_active(tenantId,entityType,isActive)` |
| 2 | WmsExecutionInstance | `wms_execution_instances` | id(UUID), tenantId(UUID), entityType(VARCHAR50), entityId(UUID), engineType(ENUM:STATE_MACHINE/RULE/BPMN), currentState(VARCHAR100), contextJson(JSONB), status(ENUM:RUNNING/COMPLETED/FAILED/SUSPENDED), startedAt(TIMESTAMPTZ), completedAt(TIMESTAMPTZ), errorMessage(TEXT), depth(INT) | `idx_wei_entity(tenantId,entityType,entityId)`, `idx_wei_status_time(tenantId,status,startedAt)` |
| 3 | WmsRule | `wms_rules` | id(UUID), tenantId(UUID), ruleKey(VARCHAR100), version(INT), ruleType(ENUM:DMN/JDM), definitionJson(JSONB), isActive(BOOL), createdAt, updatedAt | `uq_wr_tenant_key_version(tenantId,ruleKey,version)`, `idx_wr_type_active(tenantId,ruleType,isActive)` |
| 4 | WmsBpmnProcess | `wms_bpmn_processes` | id(UUID), tenantId(UUID), processKey(VARCHAR100), version(INT), bpmnXml(TEXT), isActive(BOOL), createdAt, updatedAt | `uq_wbp_tenant_key_version(tenantId,processKey,version)`, `idx_wbp_tenant_active(tenantId,isActive)` |

**Migration SQL:**
```sql
CREATE TYPE engine_type AS ENUM ('STATE_MACHINE', 'RULE', 'BPMN');
CREATE TYPE execution_status AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'SUSPENDED');
CREATE TYPE rule_type AS ENUM ('DMN', 'JDM');

CREATE TABLE multitenant.wms_state_machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  machine_key VARCHAR(100) NOT NULL,
  version INTEGER DEFAULT 1,
  definition_json JSONB NOT NULL,
  entity_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, machine_key, version)
);
CREATE INDEX idx_wsm_entity_active ON multitenant.wms_state_machines(tenant_id, entity_type, is_active);

CREATE TABLE multitenant.wms_execution_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  engine_type engine_type,
  current_state VARCHAR(100),
  context_json JSONB,
  status execution_status DEFAULT 'RUNNING',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  depth INTEGER DEFAULT 0
);
CREATE INDEX idx_wei_entity ON multitenant.wms_execution_instances(tenant_id, entity_type, entity_id);
CREATE INDEX idx_wei_status_time ON multitenant.wms_execution_instances(tenant_id, status, started_at);

CREATE TABLE multitenant.wms_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rule_key VARCHAR(100) NOT NULL,
  version INTEGER DEFAULT 1,
  rule_type rule_type NOT NULL,
  definition_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, rule_key, version)
);
CREATE INDEX idx_wr_type_active ON multitenant.wms_rules(tenant_id, rule_type, is_active);

CREATE TABLE multitenant.wms_bpmn_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  process_key VARCHAR(100) NOT NULL,
  version INTEGER DEFAULT 1,
  bpmn_xml TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, process_key, version)
);
CREATE INDEX idx_wbp_tenant_active ON multitenant.wms_bpmn_processes(tenant_id, is_active);
```

---

## Module Structure

```
src/workflow/
├── workflow.module.ts
├── orchestrator/
│   └── workflow-orchestrator.service.ts
├── state-machine/
│   ├── state-machine.service.ts
│   └── web/state-machine.controller.ts
├── rule-engine/
│   ├── rule-engine.service.ts
│   ├── zen-engine.ts
│   ├── jdm-engine.ts
│   ├── context-resolvers/
│   │   ├── inventory.resolver.ts
│   │   ├── carrier-rate.resolver.ts
│   │   └── product-attribute.resolver.ts
│   └── web/rule.controller.ts
├── bpmn/
│   ├── bpmn.service.ts
│   ├── bpmn-processor.ts
│   └── web/bpmn.controller.ts
└── dtos/
```

---

## Web Endpoints

| Domain | Method | Path |
|--------|--------|------|
| State Machines | POST/GET/PATCH | `/web/workflow/state-machines[/:id]` |
| State Machines | POST | `/web/workflow/state-machines/:id/execute` |
| Execution Instances | GET | `/web/workflow/instances` |
| Execution Instances | GET | `/web/workflow/instances/:id` |
| Rules | POST/GET/PATCH | `/web/workflow/rules[/:id]` |
| Rules | POST | `/web/workflow/rules/:id/evaluate` |
| BPMN Processes | POST/GET/PATCH | `/web/workflow/bpmn-processes[/:id]` |
| BPMN Processes | POST | `/web/workflow/bpmn-processes/:id/start` |

## Orchestration Flow

```
BPMN start → serviceTask:evaluateRule (JDM/DMN) → serviceTask:transitionStateMachine (XState) → signal completion
```

Registered service tasks:
- `evaluateRule` — evaluates a DMN/JDM rule
- `transitionStateMachine` — transitions an XState machine
- `checkInventory` — queries inventory_on_hand
- `createAuditLog` — writes to system_audit_log

## Safety Mechanisms

- **Depth limits:** State machine = 20, BPMN = 50
- **Function injection detection:** Scan definitionJson/bpmnXml for suspicious patterns
- **Expression blacklist:** Block eval(), Function(), require(), import()
- **Recovery job:** Cron every 6h, auto-suspend instances running >24h

## Redis Caching

| Cache | Key | TTL |
|-------|-----|-----|
| State machine def | `wms:sm:{tenantId}:{machineKey}:v{version}` | 300s |
| Rule def | `wms:rule:{tenantId}:{ruleKey}:v{version}` | 300s |
| Rule input hash | In-memory Map | 60s |

## BullMQ Queues

- `workflow-recovery` — recovery job for long-running instances

## CASL Subjects to Add

`'WorkflowInstance' | 'StateMachine' | 'Rule' | 'BpmnProcess'`

## Tenant Isolation — Add to `hasTenantId()`

All 4 new models.

## Tests

| Test | File |
|------|------|
| State machine execution + persistence | `workflow/state-machine/state-machine.service.spec.ts` |
| Rule evaluation (DMN + JDM) | `workflow/rule-engine/rule-engine.service.spec.ts` |
| BPMN process start + service task dispatch | `workflow/bpmn/bpmn.service.spec.ts` |
| Orchestrator flow (BPMN→Rule→SM) | `workflow/orchestrator/workflow-orchestrator.service.spec.ts` |
| Safety mechanisms (depth/injection) | `workflow/orchestrator/safety.service.spec.ts` |
