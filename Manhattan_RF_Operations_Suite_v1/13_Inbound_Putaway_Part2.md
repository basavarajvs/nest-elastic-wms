# Document 5 – Inbound Putaway (Part 2)
# Manhattan WMS RF Operations Guide

## Putaway Strategies

### Why Putaway Strategies Exist

If operators choose locations manually:

```text
Operator A -> Location X
Operator B -> Location Y
Operator C -> Location Z
```

Inventory becomes inconsistent.

Manhattan uses rules to determine optimal storage.

---

## Fixed Location Strategy

### Concept

Each SKU has a predefined home location.

Example:

```text
SKU-A

Home:
A-01-02-03
```

---

### Why Use It

Benefits:

- Easy to find inventory
- Simple training
- Predictable replenishment

---

### Drawbacks

Storage utilization may decrease.

Empty locations remain reserved.

---

## Dynamic Location Strategy

### Concept

Inventory can be stored in any valid location.

Example:

```text
SKU-A

Today:
A-01-02-03

Tomorrow:
B-05-04-02
```

---

### Why Use It

Maximizes storage utilization.

---

### Warehouse Reality

Most large 3PL warehouses prefer dynamic storage.

---

## Forward Pick Locations

### Concept

Locations optimized for frequent picking.

Example:

```text
Near Packing Area
```

---

### Why They Exist

Fast-moving inventory should be easy to access.

---

### Warehouse Example

Top 100 SKUs may generate:

```text
80% of picks
```

Keeping them near outbound improves productivity.

---

## Reserve Storage

### Concept

Bulk inventory stored away from active picking areas.

Example:

```text
Pallet Racks
High Bay Storage
```

---

### Why It Exists

Forward pick locations are limited.

Reserve inventory replenishes forward pick inventory.

---

## Velocity-Based Slotting

### Concept

Storage assignment based on inventory movement frequency.

---

### Fast-Moving SKU

Assigned near:

```text
Shipping
Packing
Main Travel Paths
```

---

### Slow-Moving SKU

Assigned deeper in warehouse.

---

### Why This Exists

Reduces picker travel time.

---

## Capacity Rules

### Warehouse Reality

A location may only support:

```text
Weight:
1000 KG

Volume:
2 Pallets
```

---

### Manhattan Validation

Verify:

- Weight capacity
- Volume capacity
- Remaining space

---

### What Breaks If Removed

Unsafe storage conditions may occur.

---

## Customer-Owned Inventory Rules

### Scenario

Warehouse stores inventory for:

```text
Puma
Kirkland
Nike
```

---

### Business Rule

Some customers prohibit commingling.

---

### Manhattan Validation

Location may only contain inventory from one owner.

---

## Hazmat Restrictions

### Why They Exist

Certain products require special storage.

Examples:

```text
Chemicals
Flammable Products
Aerosols
```

---

### Manhattan Validation

Destination location must support product class.

---

## Overflow Locations

### Scenario

Primary location full.

---

### System Decision

Assign alternate location.

Example:

```text
OVERFLOW-01
```

---

### Why This Exists

Receiving cannot stop because preferred location unavailable.

---

## Forklift Workflow Example

### What User Does

1. Scan pallet LPN
2. Pick up pallet
3. Travel to assigned rack
4. Scan rack location
5. Deposit pallet
6. Confirm task

---

### Why Scan Location?

Forklift drivers may travel:

```text
Hundreds of meters
```

Location verification prevents storage errors.

---

## Task Interleaving

### Example

Operator completes:

```text
Putaway
```

System may next assign:

```text
Cycle Count
```

instead of another putaway.

---

### Why It Exists

Reduces empty travel distance.

---

## Common Putaway Exceptions

### Location Full

Expected:

```text
A-01-02-03
```

Actual:

```text
No Space Available
```

---

### Actions

Operator selects:

```text
Location Full
```

System finds alternate location.

---

## Wrong Location Scan

Expected:

```text
A-01-02-03
```

Scanned:

```text
A-01-02-04
```

---

### Result

RF Rejects Transaction.

---

## Damaged During Movement

Inventory damaged while transporting.

Operator records:

```text
Damage Code
```

Inventory moved to:

```text
HOLD
```

or

```text
QC
```

---

## Putaway Task Lifecycle

```text
CREATED
 ↓
READY
 ↓
ASSIGNED
 ↓
IN_PROGRESS
 ↓
COMPLETED
```

---

## LPN Lifecycle

```text
RECEIVED
 ↓
STAGED
 ↓
PUTAWAY_PENDING
 ↓
STORED
```

---

## Manhattan Best Practices

1. Use directed putaway.
2. Separate reserve and forward pick storage.
3. Apply capacity rules.
4. Use velocity-based slotting.
5. Enable task interleaving.
6. Validate every destination location.
7. Capture all exceptions with reason codes.

---

# End of Putaway Document

Next:
Inventory Cycle Count
