# Document 27 – Shipping Deep Dive (Part 3)
# RF Trailer Loading
# Manhattan WMS RF Operations Guide

## 1. Business Purpose

### What Is Trailer Loading?

Trailer loading is the process of physically transferring inventory from warehouse staging areas into the outbound trailer.

This is one of the last warehouse-controlled inventory movements.

Flow:

```text
PACKED
   ↓
STAGED
   ↓
LOADED
   ↓
SHIPPED
```

---

## Why Trailer Loading Matters

If loading is incorrect:

- Wrong customer receives inventory
- Delivery delays occur
- Carrier costs increase
- Inventory traceability is lost

Many warehouses discover shipment errors only after loading.

---

## Warehouse Reality

A loader may be handling:

```text
2000 Cartons
20 Shipments
3 Loads
2 Trailers
```

during a shift.

RF validation is critical.

---

## Domain Concepts

### Loader

Warehouse associate responsible for placing inventory into trailers.

### Trailer

Physical transportation asset.

### Dock Door

Physical loading point.

Example:

```text
DOOR-05
```

---

## RF Workflow

### Step 1 – Get Loading Work

#### What User Sees

```text
Get Work
```

#### What User Does

Requests next loading assignment.

---

#### Why This Exists

System determines:

- Load
- Trailer
- Priority
- Route

---

## Step 2 – Scan Trailer

### What User Sees

```text
Scan Trailer
```

Example:

```text
TRAILER-001
```

---

### What User Does

Walks to trailer and scans trailer barcode.

---

### Why This Step Exists

Warehouse may have many trailers parked simultaneously.

The system must validate destination vehicle.

---

### Manhattan Validation

Verify:

- Trailer exists
- Trailer active
- Trailer assigned to load
- Trailer assigned to dock

---

### What Breaks If Removed

Entire shipments can be loaded into the wrong trailer.

---

## Real Example

Expected:

```text
TRAILER-001
```

Scanned:

```text
TRAILER-002
```

Result:

```text
ERROR
Wrong Trailer
```

---

## Step 3 – Scan Carton

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

Scans carton before loading.

---

### Why This Step Exists

The system must verify:

```text
Carton
 ↓
Shipment
 ↓
Load
 ↓
Trailer
```

relationship.

---

### Manhattan Validation

Verify:

- Carton exists
- Carton staged
- Carton assigned to shipment
- Shipment assigned to load
- Load assigned to trailer

---

## What Breaks If Removed

Wrong shipment may enter trailer.

---

## Step 4 – Physically Load Carton

### What User Does

Places carton into trailer.

---

### Warehouse Reality

The RF device cannot see physical loading.

Confirmation is required.

---

## Step 5 – Confirm Load

### What User Sees

```text
Loaded?
Y/N
```

---

### What User Does

Confirms carton entered trailer.

---

### Why This Exists

Creates proof of loading.

---

### State Changes

Carton:

```text
STAGED
 ↓
LOADED
```

---

## Pallet Loading

### When Used

Wholesale operations often ship pallets instead of cartons.

---

### RF Screen

```text
Scan Pallet
```

Example:

```text
PALLET-1001
```

---

### Why Pallet Loading Exists

One pallet scan may represent:

```text
50 Cartons
```

or

```text
100 Cases
```

---

## Multi-Stop Loading

### Warehouse Example

Trailer Route:

```text
Stop 1
Bangalore

Stop 2
Chennai

Stop 3
Hyderabad
```

---

### Loading Rule

Inventory for final stop loaded first.

Inventory for first stop loaded last.

---

### Why

Avoid unloading the entire trailer at each stop.

---

## Trailer Capacity Validation

### Why It Exists

Trailers have:

- Weight limits
- Volume limits

---

### Manhattan Validation

Prevent overloading.

---

## Real Warehouse Failure Scenario

### Wrong Carton Loaded

Expected:

```text
Customer A
```

Loaded:

```text
Customer B
```

Result:

- Customer complaints
- Return freight
- Inventory investigations

---

## Manhattan Best Practices

1. Scan trailer before loading.
2. Scan every carton.
3. Validate shipment-to-load relationship.
4. Use pallet loading when possible.
5. Follow multi-stop loading sequence.
6. Capture proof of loading.

---

# End Part 3

Next:
Shipment Verification Deep Dive
