# Phase 5 — Quality

**Goal:** Inspections, quality holds, non-conformance reports, compliance, hazmat, ad-hoc receiving inspections + QC dispositions.

**Depends on:** P0, P1 (products, facilities), P3 (inventory on-hand), P2 (goods receipt lines)

---

## Models (8 existing, 2 new tables)

### Existing Tables in DB

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | quality_inspections | `quality_inspections` | quality/inspections |
| 2 | quality_inspection_results | `quality_inspection_results` | quality/inspections |
| 3 | quality_inspection_events | `quality_inspection_events` | quality/inspections |
| 4 | quality_holds | `quality_holds` | quality/holds |
| 5 | non_conformance_reports | `non_conformance_reports` | quality/ncr |
| 6 | compliance_requirements | `compliance_requirements` | quality/compliance |
| 7 | compliance_audits | `compliance_audits` | quality/compliance |
| 8 | hazmat_materials | `hazmat_materials` | quality/compliance |

### New Tables to CREATE

| # | Model | Table | Fields | Key Indexes |
|---|-------|-------|--------|-------------|
| 1 | Inspection | `inspections` | id(UUID), tenantId(UUID), facilityId(UUID), grnLineId(UUID), lpnId(UUID), result(ENUM:PASS/FAIL/CONDITIONAL), inspectorUserId(UUID), inspectedAt(TIMESTAMPTZ), notes(TEXT), createdAt(TIMESTAMPTZ) | `idx_insp_grnl(tenantId,grnLineId)` |
| 2 | QcDisposition | `qc_dispositions` | id(UUID), tenantId(UUID), facilityId(UUID), grnLineId(UUID), lpnId(UUID), action(ENUM:ACCEPT/REJECT/QUARANTINE/RETURN_TO_VENDOR/REWORK/DESTROY), dispositionByUserId(UUID), dispositionDate(TIMESTAMPTZ), reason(TEXT), createdAt(TIMESTAMPTZ) | `idx_qcd_grnl(tenantId,grnLineId)` |

**Migration SQL:**
```sql
CREATE TYPE disposition_action AS ENUM ('ACCEPT','REJECT','QUARANTINE','RETURN_TO_VENDOR','REWORK','DESTROY');
CREATE TYPE inspection_result AS ENUM ('PASS','FAIL','CONDITIONAL');

CREATE TABLE multitenant.inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  facility_id UUID,
  grn_line_id UUID,
  lpn_id UUID,
  result inspection_result,
  inspector_user_id UUID,
  inspected_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_insp_grnl ON multitenant.inspections(tenant_id, grn_line_id);

CREATE TABLE multitenant.qc_dispositions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  facility_id UUID,
  grn_line_id UUID,
  lpn_id UUID,
  action disposition_action NOT NULL,
  disposition_by_user_id UUID,
  disposition_date TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_qcd_grnl ON multitenant.qc_dispositions(tenant_id, grn_line_id);
```

---

## Module Structure

```
src/quality/
├── quality.module.ts
├── inspections/               # quality_inspections + results + events
├── holds/                     # quality_holds
├── ncr/                       # non_conformance_reports
├── compliance/                # compliance_requirements, audits, hazmat
├── receiving-inspection/      # inspections + qc_dispositions (new tables)
├── web/
├── rf/
└── dtos/
```

---

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Inspections | POST/GET/PATCH | `/web/quality/inspections[/:id]` | QualityInspection |
| Inspections | POST | `/web/quality/inspections/:id/record-result` | QualityInspection |
| Inspections | GET | `/web/quality/inspections/:id/timeline` | QualityInspection |
| Holds | POST/GET/PATCH | `/web/quality-holds[/:id]` | QualityInspection |
| Holds | POST | `/web/quality-holds/:id/release` | QualityInspection |
| NCR | POST/GET/PATCH | `/web/non-conformance-reports[/:id]` | QualityInspection |
| Compliance | POST/GET/PATCH | `/web/compliance-requirements[/:id]` | ComplianceRequirement |
| Audits | POST/GET/PATCH | `/web/compliance-audits[/:id]` | ComplianceAudit |
| Hazmat | POST/GET/PATCH | `/web/hazmat-materials[/:id]` | HazmatMaterial |
| Receiving Inspection | POST | `/web/receiving-inspections` | GoodsReceipt |
| QC Dispositions | POST | `/web/qc-dispositions` | GoodsReceipt |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/quality/inspections/my-tasks` | performQc | List assigned inspections |
| `POST /rf/quality/inspections/:id/record-result` | performQc | Record pass/fail/conditional |

## CASL Subjects to Add

`'QualityInspection' | 'ComplianceRequirement' | 'ComplianceAudit' | 'HazmatMaterial'`

## Tenant Isolation — Add to `hasTenantId()`

All 8 existing + 2 new models.

## Tests

| Test | File |
|------|------|
| Inspection CRUD + result recording | `quality/inspections/inspection.service.spec.ts` |
| NCR workflow | `quality/ncr/ncr.service.spec.ts` |
| Compliance audit scheduling | `quality/compliance/compliance.service.spec.ts` |
