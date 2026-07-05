# Document 1A – Wave Picking Deep Dive (Part 3)
# Manhattan WMS RF Operations Guide

## Full Pallet Picking

### Why Full Pallet Picking Exists

Not every customer order is small.

Wholesale and retail replenishment orders often require:

```text
Entire Pallets
```

instead of individual units.

---

### Warehouse Example

Customer:

```text
Retail Store
```

Order:

```text
48 Cases
```

Stored As:

```text
1 Full Pallet
```

Instead of breaking the pallet:

```text
Move Entire Pallet
```

---

## What User Sees

```text
Pick Pallet

LPN:
PALLET-1001
```

---

## What User Does

Forklift operator:

1. Drives to location
2. Scans pallet
3. Lifts pallet
4. Moves pallet to staging

---

## Why This Step Exists

Handling inventory once is cheaper than:

```text
Break Pallet
Pick Cases
Rebuild Pallet
```

---

## Case Picking

### What Is Case Picking?

Inventory is picked at case level.

Example:

```text
Case Quantity = 12
```

Order:

```text
24 Units
```

Picker selects:

```text
2 Cases
```

---

## Why Case Picking Exists

Case handling is faster than:

```text
24 Individual Picks
```

---

## Warehouse Reality

Many food and consumer goods warehouses operate primarily using case picking.

---

## Forklift Operations

### What User Is Physically Doing

Forklift operators may:

```text
Travel Hundreds Of Meters
```

for a single task.

---

### Why RF Validation Matters

Without RF:

```text
Wrong Pallet
Wrong Location
Wrong Shipment
```

becomes possible.

---

## Reserve Storage vs Forward Pick

### Forward Pick

Purpose:

```text
Fast Access
```

Example:

```text
Ground-Level Pick Face
```

---

### Reserve Storage

Purpose:

```text
Bulk Inventory
```

Example:

```text
Upper Pallet Rack
```

---

### Warehouse Example

Forward Pick:

```text
20 Cases
```

Reserve:

```text
200 Cases
```

---

## Why Two Storage Types Exist

Keeping all inventory in pick locations would waste valuable space.

Reserve storage acts as warehouse inventory buffer.

---

## Replenishment Interaction

### What Is Replenishment?

Movement of inventory from:

```text
Reserve Storage
```

to

```text
Forward Pick
```

---

### Why Replenishment Exists

Pickers consume inventory.

Eventually pick locations become empty.

---

### Example

Forward Pick:

```text
Qty 5
```

Required:

```text
Qty 10
```

Result:

```text
Shortage
```

---

### Manhattan Behavior

System generates:

```text
Replenishment Task
```

---

### What User Sees

Replenishment Operator:

```text
Move Inventory

FROM:
Reserve

TO:
Forward Pick
```

---

### Why Manhattan Creates A Separate Task

Picking and replenishment often involve:

```text
Different Equipment
Different Operators
```

---

## What Happens If Replenishment Is Ignored

Picker arrives.

Location contains:

```text
0 Inventory
```

Result:

```text
Short Pick
```

Customer orders delayed.

---

## Warehouse Example

Customer:

```text
Kirkland
```

Order Demand:

```text
500 Cases
```

Forward Pick:

```text
100 Cases
```

Reserve:

```text
1000 Cases
```

Manhattan replenishes before pick face empties.

---

## Manhattan Best Practices

1. Use full pallet picks whenever possible.
2. Use case picks before each picks.
3. Separate reserve and forward inventory.
4. Automate replenishment.
5. Use RF validation for all forklift tasks.
6. Minimize inventory touches.

---

# End of Wave Picking Deep Dive Part 3

Part 4:
Task Interleaving
Short Picks
Allocation Impact
Wave Completion Logic
Real Warehouse Failure Scenarios
