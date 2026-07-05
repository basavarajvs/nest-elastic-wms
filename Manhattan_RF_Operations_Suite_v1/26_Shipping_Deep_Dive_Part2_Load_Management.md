# Document 26 – Shipping Deep Dive (Part 2)
# Load Management
# Manhattan WMS RF Operations Guide

## 1. Business Purpose

### What Is A Load?

A load is a collection of shipments that will travel together on the same trailer.

Most architects incorrectly think:

```text
Shipment
    ↓
Trailer
```

Manhattan typically thinks:

```text
Carton
    ↓
Shipment
    ↓
Load
    ↓
Trailer
    ↓
Route
```

The Load is the central planning object.

---

## Why Loads Exist

Without loads:

```text
Shipment A
Shipment B
Shipment C
```

would be loaded independently.

This causes:

- Poor trailer utilization
- Poor route planning
- More carrier costs

---

## Warehouse Reality

A trailer rarely carries:

```text
1 Shipment
```

Instead:

```text
50 Shipments
200 Cartons
10 Pallets
```

may travel together.

---

## Domain Concepts

### Shipment

Customer demand.

Example:

```text
Customer:
Puma

Order:
SO-1001
```

---

### Load

Transportation grouping.

Example:

```text
LOAD-1001

Shipment A
Shipment B
Shipment C
```

---

### Trailer

Physical transportation asset.

Example:

```text
TRAILER-001
```

---

## Load Hierarchy

Example:

```text
LOAD-1001

Shipment A
    CTN-001
    CTN-002

Shipment B
    CTN-003

Shipment C
    CTN-004
    CTN-005
```

---

## Types Of Loads

### FTL

Full Truck Load

Entire trailer assigned to one customer or route.

---

### LTL

Less Than Truckload

Multiple customers share trailer space.

---

### Multi-Stop Load

Example:

```text
Stop 1
Bangalore

Stop 2
Chennai

Stop 3
Hyderabad
```

---

## Why Multi-Stop Matters

Loading order matters.

Example:

```text
Stop 3 inventory loaded first

Stop 1 inventory loaded last
```

to avoid unloading the entire trailer.

---

## Warehouse Reality

Loaders often never see customer orders.

They load based on:

```text
Load
```

not:

```text
Order
```

---

## RF Workflow

### Step 1 – Scan Load

#### What User Sees

```text
Scan Load
```

Example:

```text
LOAD-1001
```

---

#### What User Does

Associates work with load.

---

#### Why This Exists

System must know:

- Which trailer
- Which route
- Which shipments

are being processed.

---

## Step 2 – Verify Trailer

### What User Sees

```text
Scan Trailer
```

---

### Why This Exists

The load must be attached to correct trailer.

---

### Manhattan Validation

Verify:

```text
LOAD-1001

belongs to

TRAILER-001
```

---

## State Changes

Load:

```text
CREATED
 ↓
PLANNED
 ↓
ASSIGNED
```

---

## What Breaks If Removed

Warehouse can load correct shipment into wrong transportation plan.

---

## Real Warehouse Example

Carrier:

```text
DHL
```

Load:

```text
LOAD-1001
```

Contains:

```text
Puma
Nike
Kirkland
```

shipments.

Trailer departs once all shipments are loaded.

---

## Manhattan Best Practices

1. Plan loads before staging.
2. Assign trailers before loading.
3. Validate every trailer assignment.
4. Separate FTL and LTL processes.
5. Use load-level visibility.

---

# End Part 2

Next:
RF Trailer Loading Deep Dive
