# Document 7 – Outbound Shipping (Part 1)
# Manhattan WMS RF Operations Guide

## 1. Business Overview

### Purpose

Shipping is the process of transferring packed inventory from warehouse custody to carrier custody.

Before Shipping:

```text
Inventory Packed
Inventory Staged
```

After Shipping:

```text
Inventory Loaded
Inventory Shipped
Carrier Responsible
```

---

## Why Shipping Exists

The warehouse has fulfilled its responsibilities only when inventory leaves the facility correctly.

Shipping ensures:

- Correct customer
- Correct shipment
- Correct carrier
- Correct route
- Complete audit trail

---

## Warehouse Reality

A shipping dock may process:

```text
Hundreds of shipments
Thousands of cartons
Multiple carriers
```

every day.

Without controls, cartons can easily be loaded onto the wrong truck.

---

## Domain Concepts

### Staging Lane

Temporary location where packed cartons wait for loading.

Example:

```text
STAGE-DOOR-01
```

---

### Load

Collection of shipments assigned to a trailer.

Example:

```text
LOAD-1001
```

---

### Trailer

Physical vehicle receiving shipments.

Example:

```text
TRAILER-ABC123
```

---

### Manifest

Official record of what is loaded onto a shipment.

---

## High-Level Flow

```text
Packing Complete
       ↓
Stage Cartons
       ↓
Assign Load
       ↓
Assign Trailer
       ↓
Load Cartons
       ↓
Verify Shipment
       ↓
Close Load
       ↓
Ship
```

---

# Step 1 – Get Shipping Work

## What User Sees

```text
Shipping Menu

Get Work
```

---

## What User Does

Requests next loading task.

---

## Why This Step Exists

System determines:

- Priority
- Door
- Trailer
- Load

---

## Domain Concept

Directed Loading

Operator does not choose shipments.

System assigns work.

---

# Step 2 – Scan Trailer

## What User Sees

```text
Scan Trailer
```

---

## What User Does

Scans trailer barcode.

Example:

```text
TRAILER-001
```

---

## Why This Step Exists

System must verify destination vehicle.

---

## Warehouse Reality

Many trailers may be parked at adjacent doors.

---

## Manhattan Validation

Verify:

- Trailer exists
- Trailer assigned
- Trailer active

---

## What Breaks If Removed

Entire shipments may be loaded onto wrong truck.

---

# Step 3 – Scan Carton

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

Scans carton before loading.

---

## Why This Step Exists

System verifies carton belongs to assigned load.

---

## Domain Concept

Shipment Verification

Ensures correct inventory enters trailer.

---

## Manhattan Validation

Verify:

- Carton exists
- Carton packed
- Carton staged
- Carton assigned to load

---

## What Breaks If Removed

Wrong customer inventory may be shipped.

---

# Step 4 – Load Carton

## What User Does

Places carton into trailer.

---

## Why This Step Exists

Physical transfer of inventory into outbound vehicle.

---

## Warehouse Reality

Some loads contain:

```text
Thousands of cartons
```

requiring scanning discipline.

---

## State Changes

Carton:

```text
STAGED
 ↓
LOADED
```

---

# Step 5 – Confirm Load

## What User Sees

```text
Confirm Load?
Y/N
```

---

## What User Does

Confirms carton successfully loaded.

---

## Why This Step Exists

Creates proof of loading.

---

## Domain Concept

Custody Tracking

Warehouse records exactly when inventory entered trailer.

---

# End of Shipping Part 1

Part 2 will cover:

- Load Management
- Manifesting
- Wrong Truck Scenarios
- Missing Cartons
- Shipment Verification
- Shipment Closure
- LPN Lifecycle
- Shipment Lifecycle
- Audit Trail
- Carrier Handoff
