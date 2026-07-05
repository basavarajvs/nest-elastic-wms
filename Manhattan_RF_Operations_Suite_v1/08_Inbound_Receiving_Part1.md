# Document 3 – Inbound Receiving (Part 1)
# Manhattan WMS RF Operations Guide

## 1. Business Overview

### Purpose

Receiving is the process of accepting inventory into the warehouse.

Before Receiving:

```text
Inventory
Owned by Supplier
```

After Receiving:

```text
Inventory
Owned by Warehouse
```

Receiving establishes:

- Inventory visibility
- Traceability
- Ownership
- Quantity accuracy

---

## 2. Warehouse Reality

A truck arrives at the warehouse.

Example:

```text
Supplier:
Puma

Truck:
TRK-1001

Contents:
500 T-Shirts
200 Shorts
```

The warehouse cannot assume:

- Quantities are correct
- Items are correct
- Packaging is intact

Everything must be verified.

---

## 3. Domain Concepts

### ASN (Advanced Shipping Notice)

ASN tells warehouse what supplier claims is arriving.

Example:

```text
ASN-1001

SKU-A Qty 500
SKU-B Qty 200
```

Receiving validates actual inventory against ASN.

---

### Dock Door

Physical unloading location.

Example:

```text
DOOR-01
```

---

### Receiving LPN

Container representing received inventory.

Example:

```text
LPN-1001
```

May represent:

- Pallet
- Carton
- Tote

---

## High Level Flow

```text
Truck Arrival
     ↓
Dock Assignment
     ↓
ASN Verification
     ↓
Unload Inventory
     ↓
Receive Inventory
     ↓
Create LPN
     ↓
Stage Inventory
     ↓
Ready For QC / Putaway
```

---

# Step 1 – Truck Arrival

## What User Sees

```text
Inbound Menu
```

Option:

```text
Check In Trailer
```

---

## What User Does

Gate operator or receiving clerk records truck arrival.

---

## Why This Step Exists

Warehouse must know:

```text
Who arrived
What arrived
When it arrived
```

---

## Domain Concept

Trailer Check-In

Arrival officially enters warehouse control.

---

## Warehouse Reality

Warehouses may receive:

```text
Hundreds of trailers
per day
```

Arrival control prevents congestion.

---

## What Breaks If Removed

No audit trail for inbound inventory.

---

# Step 2 – Dock Assignment

## What User Sees

```text
Assign Door
```

Example:

```text
DOOR-05
```

---

## What User Does

Directs trailer to assigned dock.

---

## Why This Step Exists

Inventory must be unloaded at known location.

---

## Domain Concept

Dock Management

Controls inbound traffic.

---

## Manhattan Validation

Verify:

- Door active
- Door available
- Door supports trailer type

---

# Step 3 – ASN Verification

## What User Sees

```text
Scan ASN
```

Example:

```text
ASN-1001
```

---

## What User Does

Scans ASN paperwork or barcode.

---

## Why This Step Exists

System must determine expected inventory.

---

## Domain Concept

Expected Receipt

Receiving compares:

```text
Expected
vs
Actual
```

---

## Warehouse Reality

Without ASN:

Receiving becomes blind receiving.

Higher error rates.

---

## Manhattan Validation

Verify:

- ASN exists
- ASN open
- ASN not already received

---

## What Breaks If Removed

Warehouse cannot verify supplier accuracy.

---

# Step 4 – Unload Inventory

## What User Sees

```text
Begin Unload
```

---

## What User Does

Forklift operator unloads pallets.

---

## Why This Step Exists

Inventory must move from trailer into warehouse control.

---

## Domain Concept

Transfer Of Custody

Responsibility moves from carrier to warehouse.

---

## Warehouse Reality

Damage often discovered during unloading.

---

# Step 5 – Scan Item

## What User Sees

```text
Scan Item
```

---

## What User Does

Scans SKU barcode.

---

## Why This Step Exists

System must identify inventory being received.

---

## Domain Concept

Inventory Identification

Every inventory transaction requires:

```text
What Item
```

---

## Manhattan Validation

Verify:

- Item exists
- Item expected on ASN

---

# Step 6 – Enter Quantity

## What User Sees

```text
Enter Qty
```

---

## What User Does

Counts inventory.

Enters quantity.

---

## Why This Step Exists

Warehouse verifies supplier quantity claims.

---

## Warehouse Reality

Supplier paperwork is frequently inaccurate.

---

## Manhattan Validation

Verify:

- Quantity within tolerance

---

## Example

Expected:

```text
500
```

Actual:

```text
495
```

Result:

Under Receipt

---

# End of Receiving Part 1

Part 2 will cover:

- LPN Creation
- Pallet Receiving
- Over Receipt
- Under Receipt
- Damage Handling
- Staging
- Receiving State Changes
- ASN Lifecycle
- LPN Lifecycle
