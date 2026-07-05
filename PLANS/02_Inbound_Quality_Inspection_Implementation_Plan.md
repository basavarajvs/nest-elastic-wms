# Inbound Quality Inspection — RF Implementation Plan

**Reference:** Manhattan_RF_Operations_Suite_v1 Parts 1-2  
**Existing Code:** `src/quality/` — RfInspectionController (3 endpoints), InspectionService (7 methods)  
**Status:** 40% Complete — basic inspection CRUD exists; missing inspection profiles, defect codes, directed work, sampling, lot/expiry validation, supervisor review, conditional pass  

---

## Summary of Manhattan Process

```
Receiving Complete → Inventory enters QC_HOLD → QC Task Created (Directed Work)
→ Operator Gets Work → Scan LPN → Load Inspection Checklist (Profile-based)
→ Record Findings/Defects → Lot Validation → Expiry Validation → Temperature Check
→ PASS / CONDITIONAL_PASS / FAIL → [Supervisor Review if needed]
→ LPN status update → Audit trail
```

---

## GAP-1: Missing Inspection Profiles (Inspection Checklist)

**Manhattan Reference:** Step 3 — Inspection Profile determines which checks are required per product type  
**Current State:** No inspection profile concept. Inspections are created with raw DTO fields; no way to define what checks are needed for which product.  
**Impact:** QC operators have no guided checklist. Cannot enforce required checks per product type (pharma needs lot/expiry/temp; apparel needs color/size/stitching).

### Tasks

#### GAP-1.1: Create `inspection_profiles` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `profile_id`, `tenant_id`, `profile_name`, `description`, `is_active`

#### GAP-1.2: Create `inspection_checklist_items` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `item_id`, `profile_id` (FK), `check_type` (PACKAGING/LABEL/QUANTITY/EXPIRY/SEAL_INTEGRITY/LOT_NUMBER/TEMPERATURE/COLOR/SIZE/DOCUMENTATION/CUSTOM), `check_label`, `is_mandatory`, `sort_order`, `acceptable_criteria`

#### GAP-1.3: Create `product_inspection_profiles` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `mapping_id`, `tenant_id`, `product_id` (FK), `profile_id` (FK), `vendor_id` (nullable), `min_expiry_days`, `temperature_min`, `temperature_max`, `sampling_percentage`, `sampling_method` (100_PERCENT/STATISTICAL/FIXED_COUNT), `is_active`

#### GAP-1.4: Create Inspection Profile Service + Web Endpoints
- **File:** `src/quality/inspections/inspection-profile.service.ts`
- **File:** `src/quality/inspections/web/inspection-profile.controller.ts`
- Methods: CRUD for profiles and checklist items, associate products with profiles
- Web: POST/GET/PATCH `/web/inspection-profiles[/:id]`, GET `/web/inspection-profiles/:id/checklist`, POST `/web/inspection-profiles/:id/checklist`, POST `/web/products/:id/inspection-profile`

#### GAP-1.5: Update Inspection Creation to Load Checklist
- **File:** `src/quality/inspections/inspection.service.ts`
- When creating inspection, look up `product_inspection_profiles` for the product → load checklist items → include in response

---

## GAP-2: Missing Defect Code Management

**Manhattan Reference:** Step 4 — Defect Found Y/N, select structured defect code  
**Current State:** `recordResult` stores a `result` string (PASS/FAIL) but no structured defect codes.  
**Impact:** No defect trend analysis. Cannot report "top 10 defect types" or track vendor quality performance.

### Tasks

#### GAP-2.1: Create `defect_codes` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `defect_code_id`, `tenant_id`, `code`, `description`, `category` (PACKAGING/LABEL/QUANTITY/PRODUCT_DAMAGE/EXPIRY/LOT_MISMATCH/SIZE/COLOR/TEMPERATURE/DOCUMENTATION), `severity` (MINOR/MAJOR/CRITICAL), `is_active`

#### GAP-2.2: Create `inspection_defects` Prisma model
- **File:** `prisma/schema.prisma`
- Fields: `defect_id`, `inspection_id`, `defect_code_id`, `quantity_affected`, `notes`, `recorded_at`, `recorded_by`

#### GAP-2.3: Defect Code Service + Web Endpoints
- **File:** `src/quality/defects/defect-code.service.ts`
- **File:** `src/quality/defects/web/defect-code.controller.ts`
- CRUD: POST/GET/PATCH `/web/defect-codes[/:id]`

#### GAP-2.4: Update `recordResult` for Structured Defect Recording
- **File:** `src/quality/inspections/inspection.service.ts`
- Accept `defects: Array<{ defectCodeId, quantityAffected, notes }>` in DTO
- Create `inspection_defects` records
- Add RF endpoint: `POST rf/quality/inspections/defect-codes` — list active defect codes for RF

---

## GAP-3: Missing CONDITIONAL_PASS Disposition

**Manhattan Reference:** Step 5 — PASS / FAIL / CONDITIONAL_PASS  
**Current State:** Only PASS and FAIL are used. `recordResult` checks for FAIL but CONDITIONAL is treated as a variant of FAIL.  
**Impact:** Cannot handle "acceptable with restrictions" (e.g., outer packaging damaged but product intact, stored with allocation restrictions).

### Tasks

#### GAP-3.1: Update result determination logic
- **File:** `src/quality/inspections/inspection.service.ts` — `recordResult()`
- Add proper 3-way outcome: PASS → QC_PASS, CONDITIONAL_PASS → QC_CONDITIONAL, FAIL → QC_FAIL
- For CONDITIONAL_PASS: set LPN status to `RESTRICTED` (not QUARANTINED), add `restriction_notes` to LPN

#### GAP-3.2: Add restriction handling to inventory
- Update `license_plate_numbers` with `restriction_notes` field
- Update inventory allocation rules to check for restricted LPNs

---

## GAP-4: Missing Lot, Expiry, and Temperature Validation

**Manhattan Reference:** Part 2 — Scan Lot Number, Expiry Date Check, Temperature Logger Review  
**Current State:** `recordResult` records `lotId` but doesn't validate against expected values. No expiry or temperature checks.  
**Impact:** Cannot verify lot traceability. Cannot enforce expiry minimums. Cannot ensure cold chain compliance.

### Tasks

#### GAP-4.1: Add lot validation to `lookupLpnForQc`
- **File:** `src/quality/inspections/inspection.service.ts`
- When LPN is scanned, fetch expected lot from ASN/goods receipt data
- Compare with actual lot number on LPN; flag mismatch

#### GAP-4.2: Add expiry validation
- **File:** `src/quality/inspections/inspection.service.ts`
- New method: `validateExpiry(tenantId, productId, expiryDate, facilityId)`
- Look up `product_inspection_profiles.min_expiry_days`
- Calculate remaining shelf life; flag violation if below threshold

#### GAP-4.3: Add RF endpoints for lot/expiry/temperature validation
- **File:** `src/quality/rf/inspection.controller.ts`
- Route: `POST rf/quality/inspections/validate-lot` — compare expected vs actual lot
- Route: `POST rf/quality/inspections/validate-expiry` — check expiry against thresholds
- Route: `POST rf/quality/inspections/validate-temperature` — record temperature reading

#### GAP-4.4: Create temperature log table
- **File:** `prisma/schema.prisma`
- Table: `inspection_temperature_logs` (inspection_id, reading_celsius, acceptable_min, acceptable_max, is_compliant, logged_at, device_id)

---

## GAP-5: Missing Directed Work (Get QC Work)

**Manhattan Reference:** Step 1 — Operator selects "Get Work", system assigns next inspection  
**Current State:** `myTasks` endpoint calls `findAll` with `assignedToUserId` filter. No proactive assignment.  
**Impact:** Operators must know which inspections are assigned to them. No priority-based assignment.

### Tasks

#### GAP-5.1: Create Directed Work method for QC
- **File:** `src/quality/inspections/inspection.service.ts`
- New method: `getNextQcTask(tenantId, facilityId, userId)`
- Find highest-priority PENDING inspection for the facility
- Auto-assign to user (status → ASSIGNED)
- Return inspection with checklist items and LPN details

#### GAP-5.2: Update RF `my-tasks` / add `get-next` endpoint
- **File:** `src/quality/rf/inspection.controller.ts`
- Route: `POST rf/quality/inspections/get-next` — directed work assignment (use 'update' action for assignment side-effect)
- Keep `my-tasks` for listing already-assigned tasks

---

## GAP-6: Missing Statistical Sampling

**Manhattan Reference:** Part 2 — For large shipments, inspect sample of N units out of total  
**Current State:** No sampling logic. Every inspection is assumed 100% of the population.  
**Impact:** Cannot efficiently QC large shipments (inspecting 50 out of 10,000 is practical; inspecting all 10,000 is not).

### Tasks

#### GAP-6.1: Add sampling configuration to inspection creation
- **File:** `src/quality/inspections/inspection.service.ts`
- Read `sampling_percentage` and `sampling_method` from `product_inspection_profiles`
- Calculate `sampleSize` based on method
- Record `sampleSize` and `totalPopulationQuantity` on inspection
- On `recordResult`: if sampling, apply result to entire population

#### GAP-6.2: Update `quality_inspections` table
- **File:** `prisma/schema.prisma`
- Add columns: `sampling_method`, `sampling_percentage`, `sample_size`, `total_population_quantity`, `population_result` (nullable — filled when sample result applied to population)

---

## GAP-7: Missing Supervisor Review Workflow

**Manhattan Reference:** Part 2 — Supervisor review for major defects, lot mismatches, expiry/temp violations  
**Current State:** No supervisor review concept. All results are final.  
**Impact:** No oversight for critical quality issues. Cannot require manager sign-off for major defects.

### Tasks

#### GAP-7.1: Auto-flag for supervisor review
- **File:** `src/quality/inspections/inspection.service.ts`
- In `recordResult`: if any defect has severity=CRITICAL → set `requires_supervisor_review=true`
- If lot mismatch or expiry/temp violation → set `requires_supervisor_review=true`
- Set inspection status to `AWAITING_SUPERVISOR_REVIEW` (not COMPLETED yet)

#### GAP-7.2: Supervisor review RF endpoints
- **File:** `src/quality/rf/inspection.controller.ts`
- Route: `POST rf/quality/inspections/pending-review` — list inspections needing review
- Route: `POST rf/quality/inspections/:id/supervisor-approve` — approve (override disposition if needed)
- Route: `POST rf/quality/inspections/:id/supervisor-reject` — reject, request reinspection

#### GAP-7.3: Web supervisor review endpoints
- **File:** `src/quality/inspections/web/inspection.controller.ts`
- Same endpoints as above for web supervisor interface

---

## Summary: Files to Create/Update

### New Files
| # | File | Purpose |
|---|------|---------|
| 1 | `src/quality/inspections/inspection-profile.service.ts` | Inspection profile + checklist CRUD |
| 2 | `src/quality/inspections/web/inspection-profile.controller.ts` | Web profile endpoints |
| 3 | `src/quality/defects/defect-code.service.ts` | Defect code CRUD |
| 4 | `src/quality/defects/web/defect-code.controller.ts` | Web defect code endpoints |
| 5 | `src/quality/defects/defect.module.ts` | NestJS module |
| 6 | `src/quality/inspections/web/inspection.controller.ts` | Web inspection CRUD + supervisor review |

### New Prisma Tables
| # | Table | Purpose |
|---|-------|---------|
| 1 | `inspection_profiles` | QC profile definitions |
| 2 | `inspection_checklist_items` | Per-profile check requirements |
| 3 | `product_inspection_profiles` | Product-to-profile mapping + thresholds |
| 4 | `defect_codes` | Structured defect categories |
| 5 | `inspection_defects` | Per-inspection defect records |
| 6 | `inspection_temperature_logs` | Temperature readings during QC |

### Updated Prisma Tables
| # | Table | Changes |
|---|-------|---------|
| 1 | `quality_inspections` | Add sampling_method, sampling_percentage, sample_size, total_population_quantity, population_result, requires_supervisor_review |
| 2 | `license_plate_numbers` | Add restriction_notes column |

### Updated Files
| # | File | Changes |
|---|------|---------|
| 1 | `src/quality/inspections/inspection.service.ts` | Add profile loading, structured defects, lot/expiry/temp validation, sampling, supervisor review flagging, conditional pass |
| 2 | `src/quality/rf/inspection.controller.ts` | Add 7 new RF endpoints (get-next, defect-codes, validate-lot, validate-expiry, validate-temperature, pending-review, supervisor-approve/reject) |
| 3 | `src/quality/quality.module.ts` | Register new sub-modules |
| 4 | `prisma/schema.prisma` | Add 6 new tables + modify 2 existing |
| 5 | `src/common/casl/casl-ability.factory.ts` | Add CASL subjects: 'InspectionProfile', 'DefectCode' |

### RF Endpoints Added
| Route | Action | Purpose |
|-------|--------|---------|
| `POST rf/quality/inspections/get-next` | update | Directed work assignment |
| `POST rf/quality/inspections/defect-codes` | read | List active defect codes |
| `POST rf/quality/inspections/validate-lot` | read | Compare expected vs actual lot |
| `POST rf/quality/inspections/validate-expiry` | read | Check expiry thresholds |
| `POST rf/quality/inspections/validate-temperature` | update | Record temperature reading |
| `POST rf/quality/inspections/pending-review` | read | List inspections needing supervisor |
| `POST rf/quality/inspections/:id/supervisor-approve` | update | Supervisor approval |
| `POST rf/quality/inspections/:id/supervisor-reject` | update | Supervisor rejection + reinspection |

### Web Endpoints Added
| Route | Method | Purpose |
|-------|--------|---------|
| `/web/inspection-profiles[/:id]` | POST/GET/PATCH | Profile CRUD |
| `/web/inspection-profiles/:id/checklist` | GET/POST | Checklist management |
| `/web/products/:id/inspection-profile` | POST | Assign profile to product |
| `/web/defect-codes[/:id]` | POST/GET/PATCH | Defect code CRUD |
| `/web/quality/inspections[/:id]` | POST/GET/PATCH | Inspection CRUD |
| `/web/quality/inspections/:id/supervisor-approve` | POST | Web supervisor approval |
| `/web/quality/inspections/:id/supervisor-reject` | POST | Web supervisor rejection |

---

## Priority & Effort

| Priority | Item | Effort |
|----------|------|--------|
| HIGH | GAP-1: Inspection profiles + checklist | Large |
| HIGH | GAP-2: Defect code management | Medium |
| HIGH | GAP-3: CONDITIONAL_PASS support | Small |
| HIGH | GAP-5: Directed QC work | Small |
| MEDIUM | GAP-4: Lot/expiry/temperature validation | Medium |
| MEDIUM | GAP-7: Supervisor review workflow | Medium |
| LOW | GAP-6: Statistical sampling | Medium |

---

## APPENDIX: Post-Verification Critical Missing Items

### APP-QC-A: Downstream Inventory Enforcement (Allocation / Pick / Ship / Putaway)

**Manhattan:** QC_HOLD, QUARANTINED, and RESTRICTED inventory MUST NOT be allocated, picked, shipped, or putaway'd to normal locations.  
**Current State:** Plan has NO tasks to update allocation, picking, shipping, or putaway modules to enforce these blocks.  
**Tasks to add:**
- **Allocation module:** Exclude LPNs with status QC_HOLD, QUARANTINED, RESTRICTED from available inventory queries
- **Picking module:** Validate LPN status before allowing pick (block if QC_HOLD/QUARANTINED/RESTRICTED)
- **Shipping module:** Validate LPN status before staging/loading (block if not PACKED/STAGED)
- **Putaway module:** Validate LPN status before assigning task (only PUTAWAY_PENDING allowed)
- Add CASL permission: `manage:qc_override` for supervisors to override blocks

### APP-QC-B: QC Task Auto-Creation Trigger (Receiving → QC Integration)

**Manhattan:** "Receiving Complete → Inventory enters QC_HOLD → QC Task Created" — the QC workflow has no defined entry point.  
**Current State:** Plan assumes QC tasks exist. No trigger from receiving to QC task creation.  
**Tasks to add:**
- In `ReceivingService.completeReceipt` or `receiveLine`: if product has inspection profile → set LPN status to QC_HOLD + auto-create `quality_inspections` task
- Check `product_inspection_profiles` for product → if profile exists, create PENDING inspection
- `damage_codes.requires_qc` trigger: when damage code with requires_qc=true is applied → auto-create QC task

### APP-QC-C: Putaway Task Creation on QC_PASS

**Manhattan:** QC_PASS → PUTAWAY_PENDING → putaway task generated. LPN lifecycle must continue.  
**Current State:** GAP-3.1 sets QC_PASS status but NO putaway task is created. LPN lifecycle dead-ends.  
**Tasks to add:**
- In `recordResult`: on PASS → set LPN status to PUTAWAY_PENDING + auto-create putaway_tasks record
- Link putaway task to the LPN ID
- On FAIL → set LPN status to either QUARANTINED (with quarantine location) or REJECTED (return/disposal)

### APP-QC-D: REJECTED Disposition (Separate from QUARANTINED)

**Manhattan:** FAIL leads to two distinct outcomes: REJECTED (return-to-vendor/disposal) or QUARANTINED (hold for review).  
**Current State:** Only QUARANTINED is modeled. REJECTED is entirely missing.  
**Tasks to add:**
- Add REJECTED status to quality_inspections result enum
- On REJECTED: create RTV (Return to Vendor) workflow or disposal workflow
- Add `disposition_type` field: `QUARANTINE | RETURN_TO_VENDOR | SCRAP`
- For REJECTED: auto-create return shipment or scrap transaction

### APP-QC-E: Scan LPN Validations (QC_HOLD status + Task Assignment)

**Manhattan:** LPN must have status QC_HOLD AND must be assigned to the operator's inspection task before allowing inspection.  
**Current State:** GAP-4.1 adds lot lookup but does NOT validate LPN status or task assignment.  
**Tasks to add:**
- In `lookupLpnForQc` or new `scanLpnForInspection`: validate LPN.status === QC_HOLD (reject otherwise with clear message)
- Validate inspected LPN's LPN_ID matches the inspection task's reference_id
- If LPN not assigned to current task: reject with "SCAN CORRECT LPN"

### APP-QC-F: Dedicated Audit Trail Table

**Manhattan:** Best Practice #6: "Maintain complete audit history" — Inspector, Timestamp, Lot, Expiry, Defects, Disposition.  
**Current State:** Data scattered across quality_inspections, quality_inspection_results, inspection_defects. No immutable audit table.  
**Tasks to add:**
- Create `inspection_audit_log` table (inspection_id, event_type, event_data JSON, recorded_by, recorded_at — immutable append-only)
- Write audit entries at key events: TASK_CREATED, TASK_ASSIGNED, LPN_SCANNED, LOT_VALIDATED, EXPIRY_CHECKED, DEFECTS_RECORDED, RESULT_RECORDED, SUPERVISOR_APPROVED, SUPERVISOR_REJECTED
- Web endpoint: GET `/web/audit/inspection/:inspectionId`

### APP-QC-G: Compliance & Regulatory Framework

**Manhattan:** QC is mandatory for regulated industries — Pharmaceutical, Medical Device, Food, Aerospace.  
**Current State:** No compliance-specific fields, workflows, or validations.  
**Tasks to add:**
- Add `regulatory_flags` to products (FDA_REGULATED, CGMP, TEMPERATURE_CONTROLLED, CONTROLLED_SUBSTANCE)
- Add `compliance_hold` flag that prevents ANY inventory movement (stronger than QC_HOLD — requires regulatory sign-off)
- Add `compliance_signoff` table for electronic signatures on critical inspections
- Support 21 CFR Part 11 style audit trail (immutable, electronic signature, timestamp, reason)

### APP-QC-H: Expiry Presence Validation (Not Just Threshold)

**Manhattan:** Expiry date must be PRESENT on item (non-null, non-blank) BEFORE threshold check.  
**Current State:** GAP-4.2 only checks threshold. Missing expiry presence validation.  
**Tasks to add:**
- In `validateExpiry`: first check expiry date is non-null / non-blank
- If expiry missing on a product where inspection profile requires it: auto-fail with "EXPIRY MISSING"
- Separate error types: `EXPIRY_MISSING` vs `EXPIRY_BELOW_THRESHOLD` vs `EXPIRY_VALID`

### APP-QC-I: Inspection Session Timeout / IN_PROGRESS State

**Manhattan:** An inspection that has been ASSIGNED but never completed needs timeout handling.  
**Current State:** GAP-5.1 sets ASSIGNED status. No IN_PROGRESS state between ASSIGNED and completion. No timeout.  
**Tasks to add:**
- Add IN_PROGRESS status to quality_inspections
- On `getNextQcTask`: set status → ASSIGNED. On first scan/checklist action: set → IN_PROGRESS
- Add timeout: if ASSIGNED and no action for 30 min, auto-unassign (return to PENDING)
- Add method: `abandonInspection` for operator to release task back to pool

### APP-QC-J: Reinforcement Workflow Model

**Manhattan:** After supervisor rejects, a completely new inspection task is created, linked to original.  
**Current State:** Only `supervisor-reject` endpoint exists. No new task creation. No original linkage.  
**Tasks to add:**
- On supervisor reject: create NEW `quality_inspections` record with `parent_inspection_id` = original
- Set new task status to PENDING, reset LPN to QC_HOLD
- Prevent original operator from being assigned to the reinspection (different operator)
- On reinspection complete: compare results between original and reinspection
- If both agree → finalize. If disagree → escalate (2-level escalation)
