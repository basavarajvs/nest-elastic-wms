# Document 4 – Inbound Quality Inspection (Part 1)
# Manhattan WMS RF Operations Guide

## 1. Business Overview

### Purpose

Quality Inspection (QC) verifies that inventory received into the warehouse is fit for storage, sale, or shipment.

Receiving answers:

```text
Did inventory arrive?
```

Quality Inspection answers:

```text
Is inventory acceptable?
```

---

## Why QC Exists

Without QC, warehouses may:

- Store damaged inventory
- Ship defective products
- Violate regulatory requirements
- Mix sellable and non-sellable stock

QC protects inventory integrity.

---

## Warehouse Reality

Not all inventory requires inspection.

Example:

### Customer A

```text
Office Furniture
```

May require:

```text
Visual inspection only
```

### Customer B

```text
Pharmaceutical Products
```

May require:

```text
Lot Verification
Expiry Verification
Seal Verification
Temperature Verification
```

---

## Domain Concepts

### QC Hold

Inventory is temporarily blocked.

Example:

```text
LPN-1001

Status:
QC_HOLD
```

Inventory cannot:

- Be allocated
- Be picked
- Be shipped

until inspection completes.

---

### Inspection Task

Work assigned to a QC operator.

Example:

```text
Inspect:
LPN-1001
```

---

### Inspection Result

Possible outcomes:

```text
PASS
FAIL
CONDITIONAL_PASS
```

---

## High-Level Process Flow

```text
Receiving Complete
       ↓
Inventory Staged
       ↓
QC Task Created
       ↓
QC Inspection
       ↓
PASS / FAIL
       ↓
Putaway or Hold
```

---

# Step 1 – Get QC Work

## What User Sees

```text
Quality Inspection

1 Get Work
2 Exceptions
```

Operator selects:

```text
Get Work
```

---

## What User Does

Requests next inspection assignment.

---

## Why This Step Exists

The system determines:

- Which inventory requires inspection
- Inspection priority
- Inspector assignment

---

## Domain Concept

Directed Work

Manhattan assigns work.

Inspectors do not decide what to inspect.

---

## Warehouse Reality

A warehouse may have:

```text
500 received pallets
```

Only:

```text
50
```

may require inspection.

---

# Step 2 – Scan LPN

## What User Sees

```text
Scan LPN
```

---

## What User Does

Scans pallet or carton.

Example:

```text
LPN-1001
```

---

## Why This Step Exists

System must identify inventory being inspected.

---

## Domain Concept

Inventory Traceability

Inspection result must be tied to specific inventory.

---

## Manhattan Validation

Verify:

- LPN exists
- LPN status = QC_HOLD
- LPN assigned to inspection task

---

## What Breaks If Removed

Inspection results may be applied to wrong inventory.

---

# Step 3 – Load Inspection Checklist

## What User Sees

Example:

```text
Check Packaging
Check Label
Check Quantity
Check Expiry
```

---

## What User Does

Performs physical inspection.

---

## Why This Step Exists

Different products require different inspections.

---

## Warehouse Example

### Vitamins

Check:

```text
Expiry Date
Seal Integrity
Lot Number
```

### Apparel

Check:

```text
Color
Size
Packaging
```

---

## Domain Concept

Inspection Profile

Defines required checks.

---

# Step 4 – Record Findings

## What User Sees

```text
Defects Found?
Y/N
```

---

## What User Does

Records defects.

Example:

```text
Broken Seal
```

or

```text
Crushed Packaging
```

---

## Why This Step Exists

Warehouse needs structured defect tracking.

---

## Manhattan Validation

Require:

- Defect code
- Inspector
- Timestamp

---

# Step 5 – Pass or Fail Inventory

## What User Sees

```text
PASS
FAIL
```

---

## What User Does

Selects outcome.

---

## Why This Step Exists

Inventory must receive a disposition decision.

---

## Domain Concept

Disposition

Determines what happens next.

PASS:

```text
Ready For Putaway
```

FAIL:

```text
Blocked Inventory
```

---

## What Breaks If Removed

Warehouse cannot determine whether inventory is usable.

---

# End of QC Part 1

Part 2 will cover:

- Conditional Pass
- QC Fail Processing
- Sampling Inspections
- Lot & Expiry Validation
- Regulatory Scenarios
- QC State Transitions
- LPN Lifecycle
- Exception Handling
- Supervisor Review
- Audit Trail
