# Document 1A – Wave Picking Deep Dive (Part 2)
# Manhattan WMS RF Operations Guide

## Cluster Picking Deep Dive

### Why Cluster Picking Exists

Walking is the largest source of inefficiency in many warehouses.

Without cluster picking:

```text
Order A
Walk Warehouse

Order B
Walk Warehouse

Order C
Walk Warehouse
```

The picker repeatedly visits the same locations.

---

### Warehouse Example

Orders:

```text
Order A = 2 Shirts
Order B = 3 Shirts
Order C = 1 Shirt
```

All require:

```text
SKU-SHIRT
```

Instead of three trips:

```text
Pick Qty 6 Once
```

and distribute across totes.

---

## Physical Cart Layout

Example:

```text
Top Shelf
Tote A

Middle Shelf
Tote B

Bottom Shelf
Tote C
```

---

## What User Sees

```text
Location:
A-01-01-01

Pick Qty:
6
```

After picking:

```text
Put 2 → Tote A
Put 3 → Tote B
Put 1 → Tote C
```

---

## What User Is Physically Doing

The picker:

1. Picks inventory once
2. Places quantities into different totes
3. Continues route

---

## Why Manhattan Uses Cluster Picking

Benefits:

- Less walking
- Fewer location visits
- Higher picks per hour

---

## What Breaks If Removed

Warehouse travel increases dramatically.

---

## Batch Picking Deep Dive

### Difference From Cluster Picking

Cluster Picking:

```text
Sort During Picking
```

Batch Picking:

```text
Sort Later
```

---

### Example

Picker gathers:

```text
50 Shirts
```

for many orders.

Sorting occurs later at packing.

---

## Why Batch Picking Exists

Useful when:

```text
Very High Order Volume
```

exists.

---

## Warehouse Reality

Large eCommerce warehouses often batch pick thousands of order lines.

---

## Travel Optimization

### Why Travel Matters

A picker may walk:

```text
10–20 KM
per shift
```

Reducing travel has huge productivity impact.

---

## Manhattan Optimization Goals

Reduce:

- Walking
- Forklift travel
- Congestion

Increase:

- Picks per hour
- Equipment utilization

---

## Example Route Optimization

Without Optimization:

```text
Aisle 1
Aisle 10
Aisle 2
Aisle 9
```

With Optimization:

```text
Aisle 1
Aisle 2
Aisle 3
Aisle 4
```

---

## Physical Warehouse Example

Customer:

```text
Puma
```

Wave Contains:

```text
500 Orders
```

Demand:

```text
Black T-Shirt
Qty 1000
```

Instead of:

```text
500 Individual Picks
```

Manhattan generates:

```text
Bulk Pick
```

and distributes inventory into totes.

---

## Why RF Devices Matter

RF guidance ensures:

- Correct location
- Correct quantity
- Correct tote

at every step.

---

## Manhattan Best Practices

1. Use cluster picking for high-volume fulfillment.
2. Use batch picking when sortation exists.
3. Minimize picker travel.
4. Use directed work.
5. Scan destination containers.
6. Validate every inventory movement.

---

# End of Wave Picking Deep Dive Part 2

Part 3:
Full Pallet Picking
Case Picking
Forklift Operations
Reserve vs Forward Pick
Replenishment Interaction
