# Document 5 – Inbound Putaway (Part 1)
# Manhattan WMS RF Operations Guide

## 1. Business Overview

### Purpose

Putaway is the process of moving received inventory from staging into its long-term storage location.

Before Putaway:

```text
Receiving Complete
Inventory In Staging
```

After Putaway:

```text
Inventory Stored
Available For Allocation
```

---

## Why Putaway Exists

Receiving docks are temporary areas.

Inventory cannot remain there because:

- Docks become congested
- Inventory becomes difficult to locate
- Picking productivity decreases

Putaway moves inventory into controlled warehouse locations.

---

## Warehouse Reality

A warehouse may receive:

```text
100 pallets
per hour
```

If pallets remain in staging:

```text
Receiving Stops
```

because there is no space for new arrivals.

---

## Domain Concepts

### Directed Putaway

Manhattan determines where inventory should be stored.

The operator does not decide.

---

### Putaway Task

System-generated work instruction.

Example:

```text
Move:

LPN-1001

From:
STAGE-01

To:
A-01-02-03
```

---

### Storage Location

Physical location in warehouse.

Example:

```text
Aisle A
Bay 01
Level 02
Position 03
```

---

## High-Level Flow

```text
Receiving Complete
       ↓
Putaway Task Created
       ↓
Operator Gets Work
       ↓
Scan LPN
       ↓
Move Inventory
       ↓
Scan Destination
       ↓
Confirm Putaway
       ↓
Inventory Stored
```

---

# Step 1 – Get Putaway Work

## What User Sees

```text
Task Management

Get Work
```

---

## What User Does

Requests next task.

---

## Why This Step Exists

System optimizes:

- Travel path
- Equipment usage
- Warehouse capacity

---

## Domain Concept

Directed Work

Warehouse system assigns tasks.

Operator executes tasks.

---

## Warehouse Reality

Forklift operators rarely decide storage locations.

The WMS decides.

---

# Step 2 – Scan LPN

## What User Sees

```text
Scan LPN
```

Example:

```text
LPN-1001
```

---

## What User Does

Scans pallet label.

---

## Why This Step Exists

System must identify inventory being moved.

---

## Domain Concept

Container Traceability

Every movement must identify:

```text
Which Inventory
```

is moving.

---

## Manhattan Validation

Verify:

- LPN exists
- LPN status = PUTAWAY_PENDING

---

## What Breaks If Removed

Wrong pallet can be stored.

---

# Step 3 – Receive Destination Location

## What User Sees

```text
Move To:

A-01-02-03
```

---

## What User Does

Travels to destination location.

---

## Why This Step Exists

The system selected this location using putaway rules.

---

## Domain Concept

Directed Putaway

Location is not random.

---

## Warehouse Example

Inventory:

```text
Fast Moving SKU
```

may be assigned near shipping area.

Inventory:

```text
Slow Moving SKU
```

may be assigned to reserve storage.

---

## What Breaks If Removed

Inventory may be stored in inefficient locations.

Picking productivity decreases.

---

# Step 4 – Scan Destination Location

## What User Sees

```text
Scan Location
```

---

## What User Does

Scans rack barcode.

Example:

```text
A-01-02-03
```

---

## Why This Step Exists

System must verify operator reached correct location.

---

## Domain Concept

Location Verification

Prevents incorrect storage.

---

## Manhattan Validation

Verify:

Expected Location

equals

Scanned Location

---

## What Breaks If Removed

Inventory may disappear into wrong location.

---

# Step 5 – Confirm Putaway

## What User Sees

```text
Confirm Putaway?
Y/N
```

---

## What User Does

Places pallet into rack.

Confirms completion.

---

## Why This Step Exists

Inventory ownership must transfer from staging to storage location.

---

## Domain Concept

Storage Confirmation

Inventory becomes available for future processes.

---

## State Change

LPN:

```text
PUTAWAY_PENDING
 ↓
STORED
```

---

# End of Putaway Part 1

Part 2 will cover:

- Putaway Strategies
- Capacity Rules
- Fixed Locations
- Dynamic Locations
- Forward Pick Locations
- Reserve Locations
- Overflow Storage
- Forklift Scenarios
- Exceptions
