# Document 2 – Outbound Packing (Part 2)
# Manhattan WMS RF Operations Guide

## Step 5 – Nest Pick LPN Into Carton

### What User Sees

```text
Scan Pick LPN
```

Example:

```text
TOTE-001
```

System displays:

```text
Carton:
CTN-1001

Nest LPN?
Y/N
```

---

### What User Does

The packer removes inventory from the tote and places it into the carton.

After physically moving inventory, the packer confirms nesting.

---

### Why This Step Exists

This is one of the most important concepts in Manhattan.

Before nesting:

```text
Inventory Owner:
TOTE-001
```

After nesting:

```text
Inventory Owner:
CTN-1001
```

The system must know inventory moved from one container to another.

---

### Domain Concept

Container Hierarchy

```text
CTN-1001
    └── TOTE-001
```

or

```text
CTN-1001
    ├── TOTE-001
    ├── TOTE-002
    └── TOTE-003
```

---

### Warehouse Reality

A packer may receive:

```text
3 totes
```

for one shipment.

All contents are consolidated into one shipping carton.

---

### Manhattan Validation

Verify:

- Pick LPN exists
- Pick LPN belongs to shipment
- Pick LPN not already consumed
- Pick LPN status = PICKED

---

### What Breaks If Removed

The system cannot prove:

```text
Where inventory went
```

Inventory traceability is lost.

---

## Step 6 – Verify Carton Contents

### What User Sees

```text
Expected:

SKU-A Qty 5
SKU-B Qty 3
```

---

### What User Does

Visually verifies carton contents.

May scan items again if configured.

---

### Why This Step Exists

Prevents shipping:

- Wrong item
- Wrong quantity
- Wrong customer inventory

---

### Domain Concept

Shipment Verification

The final carton must match shipment expectations.

---

### Warehouse Reality

Most shipping complaints originate from packing errors rather than picking errors.

---

## Step 7 – Weight Capture

### What User Sees

```text
Place Carton On Scale
```

Scale returns:

```text
Weight:
5.2 KG
```

---

### What User Does

Places carton on scale.

Confirms measurement.

---

### Why This Step Exists

Carrier billing depends on weight.

Without weight:

- Shipping cost inaccurate
- Carrier integration fails

---

### Domain Concept

Manifest Weight

Used during carrier label generation.

---

### Manhattan Validation

Weight must:

- Be greater than zero
- Fall within configured tolerance

---

### What Breaks If Removed

Labels may be rejected by carriers.

---

## Step 8 – Carton Close

### What User Sees

```text
Close Carton?
Y/N
```

---

### What User Does

Confirms packing is complete.

---

### Why This Step Exists

Carton contents must become immutable.

After closure:

```text
No additional inventory
may be added.
```

---

### Domain Concept

Pack Completion

The carton becomes a formal shipping unit.

---

### State Changes

Carton:

```text
OPEN
 ↓
PACKED
```

Pick LPN:

```text
PICKED
 ↓
CONSUMED
```

---

### What Breaks If Removed

Inventory can continue changing after labels are printed.

---

## Step 9 – Generate Shipping Label

### What User Sees

```text
Generate Label
```

---

### What User Does

Confirms generation.

Printer produces:

```text
Carrier Label
```

---

### Why This Step Exists

Shipping carrier requires:

- Tracking Number
- Destination
- Service Level

---

### Domain Concept

Manifesting

Shipment becomes known to carrier.

---

### Warehouse Reality

Without a carrier label, cartons cannot leave the warehouse.

---

## Step 10 – Generate Packing Slip

### What User Sees

```text
Print Packing Slip
```

---

### What User Does

Places packing slip inside carton or pouch.

---

### Why This Step Exists

Customer receives shipment details.

---

### Domain Concept

Shipment Documentation

Provides contents and order reference.

---

## Sequence Diagram

```text
Packer
  ↓
RF Device
  ↓
Packing Service
  ↓
Shipment Service
  ↓
Carrier Service
```

Flow:

Assign Station
 ↓
Get Work
 ↓
Assign Carton
 ↓
Nest LPN
 ↓
Capture Weight
 ↓
Close Carton
 ↓
Generate Label
 ↓
Generate Packing Slip

---

# End of Packing Part 2

Part 3 will cover:

- Multi-carton orders
- Partial packing
- Cartonization
- Exceptions
- Damaged items
- Missing inventory
- Wrong tote
- Audit trail
- LPN lifecycle
- Shipment lifecycle
