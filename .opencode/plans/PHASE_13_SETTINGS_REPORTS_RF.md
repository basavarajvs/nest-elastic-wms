# Phase 13 — System Settings, Reports, RF Sessions & Security

**Goal:** Tenant configuration store, async report generation, RF session management, supervisor PINs, barcode printing.

**Depends on:** P0 (RedisModule, BullModule)

---

## Models (0 existing, 7 new tables)

### New Tables to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | SystemSetting | `system_settings` | id(UUID), tenantId(UUID), settingKey(VARCHAR100), value(JSONB), description(TEXT), isActive(BOOL), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt | `uq_tenant_setting_key(tenantId,settingKey)`, `idx_ss_tenant(tenantId)` |
| 2 | SystemSettingHistory | `system_setting_histories` | id(UUID), tenantId(UUID), settingKey(VARCHAR100), oldValue(JSONB), newValue(JSONB), changedBy(UUID), changedAt(TIMESTAMPTZ) | `idx_ssh_key_time(tenantId,settingKey,changedAt)` |
| 3 | WmsReportJob | `wms_report_jobs` | id(UUID), tenantId(UUID), reportType(VARCHAR50), status(VARCHAR20), parameters(JSONB), downloadUrl(TEXT), expiresAt(TIMESTAMPTZ), rowCount(INT), errorMessage(TEXT), createdAt, updatedAt | `idx_wrj_tenant_status_time(tenantId,status,createdAt)` |
| 4 | DbRfSession | `db_rf_sessions` | id(UUID), tenantId(UUID), userId(UUID), facilityId(UUID), deviceId(VARCHAR100), sessionToken(VARCHAR255), workflowType(VARCHAR50), payloadJson(JSONB), stateJson(JSONB), status(VARCHAR20), startedAt(TIMESTAMPTZ), lastActivityAt(TIMESTAMPTZ), expiresAt(TIMESTAMPTZ) | `idx_dbrfs_user(tenantId,userId)`, `idx_dbrfs_workflow(tenantId,workflowType)` |
| 5 | SupervisorPin | `supervisor_pins` | id(UUID), tenantId(UUID), userId(UUID), pinHash(VARCHAR64), isActive(BOOL), expiresAt(TIMESTAMPTZ), createdAt(TIMESTAMPTZ) | `uq_supervisor_pin_user(tenantId,userId)`, `idx_sp_user_active(tenantId,userId,isActive)` |

(Note: `resource_quotas` table #6 is created in P15.)

### Additional Module: Reports requires S3

Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

**Migration SQL:**
```sql
CREATE TABLE multitenant.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  value JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, setting_key)
);
CREATE INDEX idx_ss_tenant ON multitenant.system_settings(tenant_id);

CREATE TABLE multitenant.system_setting_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ssh_key_time ON multitenant.system_setting_histories(tenant_id, setting_key, changed_at);

CREATE TABLE multitenant.wms_report_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  parameters JSONB,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  row_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wrj_tenant_status_time ON multitenant.wms_report_jobs(tenant_id, status, created_at);

CREATE TABLE multitenant.db_rf_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  facility_id UUID,
  device_id VARCHAR(100),
  session_token VARCHAR(255),
  workflow_type VARCHAR(50),
  payload_json JSONB,
  state_json JSONB,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_dbrfs_user ON multitenant.db_rf_sessions(tenant_id, user_id);
CREATE INDEX idx_dbrfs_workflow ON multitenant.db_rf_sessions(tenant_id, workflow_type);

CREATE TABLE multitenant.supervisor_pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pin_hash VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX idx_sp_user_active ON multitenant.supervisor_pins(tenant_id, user_id, is_active);
```

---

## Module Structure

```
src/settings/
├── settings.module.ts
├── settings.service.ts
├── web/
└── dtos/

src/reports/
├── reports.module.ts
├── reports.service.ts
├── report.processor.ts
├── web/
└── dtos/

src/rf/
├── rf.module.ts
├── guards/
│   ├── rf-session.guard.ts
│   └── rf-action-lightweight.guard.ts
├── rf-session.service.ts
└── dtos/

src/security/
├── security.module.ts
├── supervisor-pin.service.ts
├── web/
└── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Settings | POST/GET/PATCH | `/web/settings[/:key]` | SystemSetting |
| Settings | GET | `/web/settings/:key/history` | SystemSetting |
| Reports | POST | `/web/reports/generate` | Report |
| Reports | GET | `/web/reports/jobs` | Report |
| Reports | GET | `/web/reports/jobs/:id/download` | Report |
| Supervisor PINs | POST | `/web/supervisor-pins` (create) | — |
| Supervisor PINs | POST | `/web/supervisor-pins/:id/verify` | — |

## RF Guards (to create)

### RfSessionGuard
- Reads `x-rf-session-id` header
- Validates session exists in `db_rf_sessions`
- Checks session is not expired
- Attaches `req.rfSession` to request

### RfActionLightweightGuard
- Reads `@RfAction()` metadata from handler
- Validates the action is permitted for the session's workflow type

## BullMQ Queues

- `report-generation` — async report generation jobs

## CASL Subjects to Add

`'SystemSetting' | 'Report' | 'RfSession'`

## Tenant Isolation — Add to `hasTenantId()`

All 5 new models (plus resource_quotas in P15).

## Tests

| Test | File |
|------|------|
| Settings CRUD + audit trail | `settings/settings.service.spec.ts` |
| Report job lifecycle + S3 upload | `reports/reports.service.spec.ts` |
| RF session validation + expiry | `rf/rf-session.service.spec.ts` |
| Supervisor PIN create + verify | `security/supervisor-pin.service.spec.ts` |
