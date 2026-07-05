# Document 25 – Shipping Deep Dive (Part 1)
# Staging Operations
# Manhattan WMS RF Operations Guide

## 1. Business Purpose

### What Is Staging?

Staging is the process of moving packed inventory from packing stations into controlled outbound holding areas before loading.

Flow:

Receiving
 ↓
Putaway
 ↓
Picking
 ↓
Packing
 ↓
STAGING
 ↓
Loading
 ↓
Shipping

---

## Why Staging Exists

A common misconception is:

```text
Pack
 ↓
Load
```

In reality, this rarely works.

Warehouses may process:

- Hundreds of shipments
- Thousands of cartons
- Multiple carriers
- Multiple routes

Cartons must be organized before loading begins.

---

## Warehouse Reality

Imagine:

```text
Door 01
UPS

Door 02
FedEx

Door 03
DHL

Door 04
Customer Pickup
```

Without staging:

Cartons accumulate randomly.

Loaders spend time searching instead of loading.

---

## Domain Concept

### Staging Lane

A staging lane is a temporary inventory location.

Example:

```text
STAGE-01
STAGE-02
STAGE-03
```

Inventory remains here until loading.

---

## Types Of Staging

### Carrier Staging

Example:

```text
UPS Lane
FedEx Lane
DHL Lane
```

Purpose:

Group shipments by carrier.

---

### Route Staging

Example:

```text
Route A
Route B
Route C
```

Purpose:

Group shipments by delivery route.

---

### Door Staging

Example:

```text
DOOR-01
DOOR-02
DOOR-03
```

Purpose:

Reduce loading travel.

---

### Wave Staging

Example:

```text
Wave 1001
Wave 1002
```

Purpose:

Keep wave shipments together.

---

## RF Workflow

### Step 1 – Get Staging Work

#### What User Sees

```text
Get Work
```

#### What User Does

Requests next staging task.

---

#### Why This Exists

The system decides:

- Which cartons move
- Which lane receives them
- Which load they belong to

---

## Step 2 – Scan Carton

### What User Sees

```text
Scan Carton
```

Example:

```text
CTN-1001
```

---

### What User Does

Scans packed carton.

---

### Why This Exists

The system identifies inventory being moved.

---

### Manhattan Validation

Verify:

- Carton exists
- Carton packed
- Carton not shipped

---

## Step 3 – Receive Staging Destination

### What User Sees

```text
Move To

STAGE-DOOR-05
```

---

### What User Does

Moves carton to staging lane.

---

### Why This Exists

The carton is being prepared for future loading.

---

## Step 4 – Scan Staging Lane

### What User Sees

```text
Scan Staging Location
```

---

### What User Does

Scans lane barcode.

Example:

```text
STAGE-DOOR-05
```

---

### Why This Exists

Verifies inventory reached correct outbound area.

---

### Manhattan Validation

Expected Lane

must equal

Scanned Lane

---

## State Changes

Carton:

```text
PACKED
 ↓
STAGED
```

Shipment:

```text
READY_FOR_STAGE
 ↓
STAGED
```

---

## What Breaks If Removed

Warehouse loses carton visibility.

Loaders cannot reliably locate inventory.

Trailer loading slows dramatically.

---

## Real Warehouse Example

Customer:

```text
Puma
```

500 Orders

Results:

```text
1200 Cartons
```

Without staging:

Loading becomes chaotic.

With staging:

Cartons are organized by:

- Route
- Carrier
- Trailer

before loading begins.

---

## Manhattan Best Practices

1. Stage immediately after packing.
2. Separate staging lanes clearly.
3. Scan every carton.
4. Validate destination lane.
5. Avoid mixed-route staging.

---

# End Part 1

Next:
Load Management Deep Dive
