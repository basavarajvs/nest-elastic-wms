# Document 2 – Outbound Packing (Part 1)
# Manhattan WMS RF Operations Guide

## 1. Business Overview

### Purpose

Packing converts picked inventory into a shippable container.

Before packing:

```text
Inventory
    ↓
Pick Location
    ↓
Pick LPN / Tote
```

After packing:

```text
Pick LPN
    ↓
Shipping Carton
    ↓
Shipping Label
    ↓
Ready For Staging
```

The objective is to ensure:

- Correct items are shipped
- Correct quantities are shipped
- Correct carrier labels are generated
- Shipment can be tracked
- Inventory traceability is maintained

---

## 2. Actors

### Packer

Responsible for:

- Verifying picked inventory
- Packing inventory into cartons
- Printing labels
- Closing cartons

### Supervisor

Responsible for:

- Handling exceptions
- Approving overrides
- Resolving shortages

---

## 3. Domain Concepts

### Pick LPN

Temporary container used during picking.

Example:

```text
TOTE-001
```

Contains:

```text
SKU-A Qty 5
SKU-B Qty 3
```

A Pick LPN is NOT a shipping container.

---

### Shipping LPN

Represents the carton that will leave the warehouse.

Example:

```text
CTN-1001
```

This carton receives:

- Shipping label
- Tracking number
- Packing slip

---

### Packing Station

Physical workstation where cartons are packed.

Usually contains:

- Scanner
- Printer
- Scale
- Workbench

---

## 4. High-Level Packing Flow

```text
Picked Inventory
        ↓
Assign Packing Station
        ↓
Assign Carton
        ↓
Scan Pick LPN
        ↓
Nest Into Carton
        ↓
Verify Contents
        ↓
Capture Weight
        ↓
Close Carton
        ↓
Generate Label
        ↓
Ready For Staging
```

---

# Step 1 – Assign Packing Station

## What User Sees

```text
Scan Station
__________
```

Example:

```text
PACK-01
```

---

## What User Does

Packer walks to workstation and scans station barcode.

---

## Why This Step Exists

The system must know:

```text
Who is packing
Where packing occurs
Which printer to use
Which scale to use
```

---

## Warehouse Reality

A warehouse may have:

```text
PACK-01
PACK-02
PACK-03
...
PACK-20
```

Without station assignment, labels may print at the wrong workstation.

---

## Domain Concept

Packing Session

A packing session represents:

```text
Operator
Station
Time Window
```

for audit purposes.

---

## Manhattan Validation

Validate:

- Station exists
- Station active
- Station not occupied

---

## What Breaks If Removed

The system cannot determine:

- Printer
- Scale
- Operator ownership

---

# Step 2 – Get Packing Work

## What User Sees

```text
Get Pack Work
```

System returns:

```text
Order: SO10001

Pick LPN:
TOTE-001
```

---

## What User Does

Operator retrieves the tote from conveyor or staging lane.

---

## Why This Step Exists

The packer does not decide what to pack.

Manhattan assigns work.

---

## Warehouse Reality

Packing stations may receive hundreds of totes per hour.

The packer needs system direction.

---

## Domain Concept

Work Assignment

Same principle as wave picking.

System assigns work.

Operator executes work.

---

# Step 3 – Scan Pick LPN

## What User Sees

```text
Scan Pick LPN
```

---

## What User Does

Scans:

```text
TOTE-001
```

---

## Why This Step Exists

System must identify:

- Inventory
- Order
- Shipment

associated with the tote.

---

## Domain Concept

Inventory Traceability

Every movement must identify:

```text
FROM
Pick LPN
```

before moving inventory elsewhere.

---

## Manhattan Validation

Verify:

- LPN exists
- LPN status = PICKED
- LPN assigned to current shipment

---

## What Breaks If Removed

Wrong tote can be packed.

Customer may receive incorrect products.

---

# Step 4 – Assign Carton

## What User Sees

```text
Scan Carton
```

Example:

```text
CTN-1001
```

---

## What User Does

Scans empty shipping carton.

---

## Why This Step Exists

The system must know where inventory is being packed.

Inventory movement requires:

```text
FROM Pick LPN
TO Carton LPN
```

---

## Domain Concept

Shipping LPN Creation

Carton becomes future shipping container.

---

## Warehouse Reality

The carton may:

- Already exist
- Be created during packing
- Be suggested by cartonization rules

---

## Manhattan Validation

Validate:

- Carton exists or can be created
- Carton not already closed
- Carton not already shipped

---

# End of Packing Part 1

Part 2 will cover:

- LPN Nesting
- Carton Verification
- Weight Capture
- Carton Close
- Label Generation
- Packing Slip Generation
- State Transitions
- Exceptions
- Multi-Carton Orders
