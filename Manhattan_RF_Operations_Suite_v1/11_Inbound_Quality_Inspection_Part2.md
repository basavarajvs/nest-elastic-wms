# Document 4 – Inbound Quality Inspection (Part 2)
# Manhattan WMS RF Operations Guide

## Conditional Pass

### Business Scenario

Inventory is usable but requires restrictions.

Example:

```text
Outer carton damaged
Product undamaged
```

---

### Inspection Result

```text
CONDITIONAL_PASS
```

---

### Why This Exists

Not every defect requires rejection.

The warehouse may:

- Store inventory
- Restrict allocation
- Notify customer

---

## Sampling Inspections

### Business Scenario

Supplier delivers:

```text
10,000 units
```

Inspecting every unit is impractical.

---

### Warehouse Reality

QC may inspect:

```text
50 units
```

representing the shipment.

---

### Domain Concept

Statistical Sampling

Inspection result is applied to the larger population.

---

## Lot Validation

### What User Sees

```text
Scan Lot Number
```

---

### Why This Exists

Warehouse must verify:

```text
Expected Lot
Actual Lot
```

---

### Warehouse Example

```text
Expected:
LOT-2026-001

Actual:
LOT-2026-002
```

Investigation required.

---

## Expiry Validation

### Warehouse Example

Product:

```text
Vitamin Supplement
```

Expiry:

```text
2026-09-01
```

Customer Requirement:

```text
Minimum 12 Months Remaining
```

---

### Why This Exists

Expired inventory cannot enter normal stock.

---

### Manhattan Validation

Verify:

- Expiry Present
- Expiry Within Limits

---

## Temperature-Controlled Inventory

### Business Scenario

Product:

```text
Medical Product
```

Requires:

```text
2°C – 8°C
```

---

### Inspection Activity

Review:

- Temperature Logger
- Shipment History

---

### What Breaks If Removed

Compromised inventory may enter supply chain.

---

## QC Fail Processing

### What User Sees

```text
FAIL
```

---

### What User Does

Selects failure reason.

Example:

```text
Packaging Damage
```

---

### Domain Concept

Disposition Decision

Inventory becomes:

```text
REJECTED
```

or

```text
QUARANTINED
```

---

## Quarantine Inventory

### Why It Exists

Inventory cannot be:

- Picked
- Allocated
- Shipped

until disposition is complete.

---

### Example

```text
LPN-1001

Status:
QUARANTINED
```

---

## LPN Lifecycle

PASS Scenario

```text
RECEIVED
 ↓
QC_HOLD
 ↓
QC_PASS
 ↓
PUTAWAY_PENDING
```

---

FAIL Scenario

```text
RECEIVED
 ↓
QC_HOLD
 ↓
QC_FAIL
 ↓
QUARANTINED
```

---

## Inventory State Transitions

```text
RECEIVED
 ↓
UNDER_INSPECTION
 ↓
AVAILABLE
```

or

```text
RECEIVED
 ↓
UNDER_INSPECTION
 ↓
BLOCKED
```

---

## Supervisor Review

Required for:

```text
Major Defects
Lot Mismatch
Expiry Violations
Temperature Violations
```

---

### Supervisor Actions

```text
Approve
Reject
Reinspect
```

---

## Audit Trail

Capture:

```text
Inspector
Timestamp
Lot
Expiry
Defects
Disposition
```

---

## Compliance Importance

Required for:

- Food
- Pharmaceutical
- Medical Device
- Regulated Products

---

## Manhattan Best Practices

1. Use inspection profiles.
2. Separate QC inventory from available inventory.
3. Capture lot and expiry at inspection.
4. Use quarantine locations.
5. Require supervisor review for major failures.
6. Maintain complete audit history.

---

# End of Quality Inspection Document

Next:
Inbound Putaway
