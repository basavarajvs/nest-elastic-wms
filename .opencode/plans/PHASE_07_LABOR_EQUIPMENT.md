# Phase 7 — Labor & Equipment

**Goal:** Shift management, time tracking, performance metrics, equipment tracking, maintenance.

**Depends on:** P0, P1 (facilities, users)

---

## Models (6 existing, 0 new tables)

| # | Schema Model | Table Name | Module |
|---|-------------|------------|--------|
| 1 | labor_shifts | `labor_shifts` | labor/shifts |
| 2 | labor_shift_assignments | `labor_shift_assignments` | labor/shifts |
| 3 | labor_time_logs | `labor_time_logs` | labor/time-tracking |
| 4 | labor_performance_metrics | `labor_performance_metrics` | labor/performance |
| 5 | warehouse_equipment | `warehouse_equipment` | equipment |
| 6 | equipment_maintenance | `equipment_maintenance` | equipment |

---

## Module Structure

```
src/labor/
├── labor.module.ts
├── shifts/                    # labor_shifts + assignments
├── time-tracking/             # labor_time_logs
├── performance/               # labor_performance_metrics
├── web/
├── rf/
└── dtos/

src/equipment/
├── equipment.module.ts
├── equipment.service.ts
├── maintenance.service.ts
├── web/
├── rf/
└── dtos/
```

## Web Endpoints

| Domain | Method | Path | CASL Subject |
|--------|--------|------|-------------|
| Shifts | POST/GET/PATCH | `/web/labor/shifts[/:id]` | LaborShift |
| Assignments | POST/GET/PATCH | `/web/labor/assignments[/:id]` | LaborShiftAssignment |
| Time Logs | GET | `/web/labor/time-logs` | LaborTimeLog |
| Performance | GET | `/web/labor/performance` | LaborPerformanceMetric |
| Equipment | POST/GET/PATCH | `/web/equipment[/:id]` | WarehouseEquipment |
| Equipment | PATCH | `/web/equipment/:id/status` | WarehouseEquipment |
| Maintenance | POST/GET/PATCH | `/web/equipment/maintenance[/:id]` | EquipmentMaintenance |
| Maintenance | POST | `/web/equipment/maintenance/:id/complete` | EquipmentMaintenance |

## RF Endpoints

| Route | Action | Purpose |
|-------|--------|---------|
| `POST /rf/labor/clock-in` | create | Clock in to shift |
| `POST /rf/labor/clock-out` | update | Clock out |
| `POST /rf/labor/my-metrics` | read | View personal performance |
| `POST /rf/equipment/available` | read | List available equipment |
| `POST /rf/equipment/:id/check-out` | create | Check out equipment |
| `POST /rf/equipment/:id/check-in` | update | Return equipment |

## CASL Subjects to Add

`'LaborShift' | 'LaborShiftAssignment' | 'LaborTimeLog' | 'LaborPerformanceMetric' | 'WarehouseEquipment' | 'EquipmentMaintenance'`

## Tenant Isolation — Add to `hasTenantId()`

All 6 models.

## Tests

| Test | File |
|------|------|
| Shift assignment + conflict check | `labor/shifts/shift.service.spec.ts` |
| Clock in/out + time log creation | `labor/time-tracking/time-tracking.service.spec.ts` |
| Performance metric calculation | `labor/performance/performance.service.spec.ts` |
| Equipment lifecycle + status transitions | `equipment/equipment.service.spec.ts` |
| Maintenance scheduling + completion | `equipment/maintenance.service.spec.ts` |
