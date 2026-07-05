# Document 1A – Wave Picking Deep Dive (Part 1)
# Manhattan WMS RF Operations Guide

## Why Picking Exists

### Business Purpose

Picking converts inventory stored in the warehouse into inventory reserved for a customer shipment.

Before Picking:

```text
Inventory Available
```

After Picking:

```text
Inventory Ready For Packing
```

Picking is the bridge between:

```text
Inventory Storage
```

and

```text
Customer Fulfillment
```

---

## Warehouse Reality

A picker is not fulfilling orders.

The picker is executing warehouse work.

Example:

Customer Orders:

```text
Order A
Order B
Order C
Order D
```

Manhattan combines demand and creates optimized pick work.

The picker only sees:

```text
Pick SKU-A Qty 20
```

not four separate customer orders.

---

## Why Warehouses Cannot Pick Directly From Orders

Without wave-based picking:

```text
Order A
Walk Warehouse

Order B
Walk Warehouse

Order C
Walk Warehouse
```

Travel distance becomes enormous.

---

## Wave Picking Concept

Wave picking groups demand.

Example:

```text
Order A = 5
Order B = 3
Order C = 2
```

System generates:

```text
Pick SKU-A Qty 10
```

---

## What User Sees

```text
Get Work
```

---

## What User Actually Does

The picker:

1. Gets work
2. Pushes cart or drives forklift
3. Travels to location
4. Picks inventory
5. Places inventory into destination container

---

## Pick-To-Tote Deep Dive

### Why Tote Picking Exists

Most eCommerce orders contain:

```text
Small Quantities
```

Picking each order individually is inefficient.

---

### Warehouse Example

Orders:

```text
Order 1 = 2 Shirts
Order 2 = 1 Shirt
Order 3 = 3 Shirts
```

Picker carries:

```text
Tote A
Tote B
Tote C
```

---

### What User Sees

```text
Scan Tote
```

---

### What User Does

Scans tote attached to cart.

Example:

```text
TOTE-001
```

---

### Why This Step Exists

The system must know where picked inventory is placed.

Inventory movement requires:

```text
FROM
Location

TO
Tote
```

---

### What Breaks If Removed

Inventory disappears from a traceability perspective.

Warehouse knows inventory left location.

Warehouse does not know where it went.

---

## Tote Lifecycle

```text
CREATED
 ↓
PICK_IN_PROGRESS
 ↓
PICK_COMPLETE
 ↓
READY_FOR_PACK
```

---

## Inventory Ownership Transfer

Before Pick:

```text
Location A-01-01-01
```

owns inventory.

After Pick:

```text
TOTE-001
```

owns inventory.

---

## Warehouse Benefits

- Reduced walking
- Higher productivity
- Better pack station throughput
- Improved order consolidation

---

# End of Wave Picking Deep Dive Part 1

Part 2:
Cluster Picking
Batch Picking
Cart Layouts
Physical Warehouse Examples
