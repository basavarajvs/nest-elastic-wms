# Document 1A – Wave Picking Deep Dive (Part 4)
# Manhattan WMS RF Operations Guide

## Task Interleaving

### What Is Task Interleaving?

Task interleaving is the process of assigning the next best task based on the operator's current location, equipment and warehouse priorities.

Instead of:

```text
Pick
Pick
Pick
Pick
```

Manhattan may assign:

```text
Pick
Putaway
Cycle Count
Pick
```

---

### Why Manhattan Uses It

The biggest waste in warehouses is empty travel.

Example:

```text
Forklift drops pallet
↓
Returns empty
```

Manhattan attempts to assign productive work during the return trip.

---

### Warehouse Example

Operator completes:

```text
Putaway
Aisle A
```

Instead of returning empty:

```text
Get Pick Task
Aisle A
```

Result:

```text
Less Travel
Higher Productivity
```

---

### Why Operators Sometimes Dislike It

Operators often prefer:

```text
Only Picking
```

or

```text
Only Putaway
```

Interleaving changes work patterns.

However warehouse productivity usually improves.

---

## Short Pick Deep Dive

### What Is A Short Pick?

Requested quantity cannot be picked.

Example:

Expected:

```text
10 Units
```

Available:

```text
8 Units
```

---

### What User Sees

```text
Required Qty: 10

Enter Actual Qty
```

Operator enters:

```text
8
```

---

### Why Short Picks Matter

A short pick is not merely a warehouse exception.

It affects:

```text
Inventory
Orders
Customers
Shipments
```

---

## Inventory Impact

System believed:

```text
10 Units
```

Reality:

```text
8 Units
```

This indicates inventory inaccuracy.

---

## Allocation Impact

Order reserved:

```text
10 Units
```

Only:

```text
8 Units
```

available.

Allocation becomes invalid.

---

## Order Impact

Order may become:

```text
Partially Fulfilled
```

or

```text
Backordered
```

---

## Customer Impact

Possible outcomes:

```text
Shipment Delay
Partial Shipment
Customer Complaint
```

---

## Common Causes Of Short Picks

### Receiving Error

Expected quantity never arrived.

---

### Picking Error

Previous picker removed inventory incorrectly.

---

### Damage

Inventory became unusable.

---

### Misplaced Inventory

Inventory exists but is stored elsewhere.

---

## Manhattan Response

System may:

```text
Create Replenishment
Create Investigation
Trigger Recount
Create Backorder
```

---

## Wave Completion Logic

### Business Question

When is a wave complete?

---

### Simple Answer

Not when picking finishes.

A wave is complete only when all required work is resolved.

---

### Example

Wave:

```text
100 Pick Tasks
```

Completed:

```text
99 Tasks
```

Remaining:

```text
1 Short Pick
```

Wave Status:

```text
NOT COMPLETE
```

---

### Why This Exists

Outstanding exceptions still affect customer shipments.

---

## Real Warehouse Failure Scenarios

### Scenario 1 – Wrong Tote

Picker scans wrong tote.

Result:

```text
Customer A receives
Customer B inventory
```

---

### Scenario 2 – Wrong Location

Picker removes inventory from adjacent location.

Result:

```text
Inventory Accuracy Drops
```

---

### Scenario 3 – Missing Replenishment

Pick face becomes empty.

Result:

```text
Mass Short Picks
```

---

### Scenario 4 – Inventory Not Counted

Cycle counts ignored.

Result:

```text
System Inventory
≠
Physical Inventory
```

---

## Why Inventory Accuracy Matters

Everything depends on inventory accuracy.

Examples:

```text
Allocation
Picking
Packing
Shipping
Cycle Counting
```

all assume inventory data is correct.

---

## Manhattan Best Practices

1. Enable task interleaving.
2. Track short pick reasons.
3. Use replenishment proactively.
4. Investigate repeated shortages.
5. Maintain inventory accuracy above 99%.
6. Scan every location.
7. Scan every destination container.
8. Use cycle counting aggressively.

---

## Summary

Wave Picking succeeds when:

```text
Correct Inventory
Correct Location
Correct Quantity
Correct Container
Correct Customer
```

are maintained throughout the process.

This is the core objective of Manhattan RF execution.

---

# End of Wave Picking Deep Dive Document

Wave Picking Revisit Complete.
