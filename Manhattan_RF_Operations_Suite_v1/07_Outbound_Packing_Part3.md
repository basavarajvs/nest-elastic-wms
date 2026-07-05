# Document 2 – Outbound Packing (Part 3)
# Manhattan WMS RF Operations Guide

## Multi-Carton Orders

### Business Scenario

Customer order:

```text
SKU-A Qty 50
SKU-B Qty 20
```

Cannot fit into one carton.

System determines:

```text
Carton 1
Carton 2
Carton 3
```

required.

---

### Why This Exists

Physical carton capacity limits:

- Weight
- Volume
- Carrier restrictions

must be respected.

---

### Warehouse Reality

Large orders routinely require multiple cartons.

The customer receives:

```text
1 of 3
2 of 3
3 of 3
```

tracking hierarchy.

---

## Domain Concept – Cartonization

Cartonization is the process of determining:

```text
How many cartons
Which carton type
Which items go where
```

---

### Manhattan Cartonization Inputs

System evaluates:

```text
Item Dimensions
Item Weight
Hazmat Rules
Carrier Rules
Customer Preferences
```

---

### Example

Items:

```text
Laptop
Monitor
Keyboard
```

System may produce:

```text
CTN-001
Laptop

CTN-002
Monitor

CTN-003
Keyboard
```

---

## Partial Packing

### Scenario

Shipment expects:

```text
SKU-A Qty 10
```

Only:

```text
Qty 8
```

available in tote.

---

### What User Sees

```text
Expected: 10
Packed:   8

Continue?
```

---

### Why This Exists

Packing may discover shortages missed during picking.

---

### Manhattan Behavior

System creates:

```text
Short Pack Exception
```

Supervisor review required.

---

## Wrong Tote Scenario

### What User Sees

```text
Scan Tote
```

Operator scans:

```text
TOTE-999
```

Expected:

```text
TOTE-001
```

---

### Validation

Verify:

- Tote belongs to shipment
- Tote assigned to station
- Tote status = PICKED

---

### What Breaks If Validation Removed

Inventory from another order can be shipped.

---

## Damaged Inventory During Packing

### Warehouse Reality

Damage is often discovered during packing:

```text
Broken Packaging
Crushed Carton
Leaking Product
```

---

### What User Sees

```text
Damaged?
Y/N
```

---

### What User Does

Selects damage code.

---

### Manhattan Actions

- Inventory Hold
- Damage Record
- Replacement Pick Request

---

## Supervisor Override

### Examples

Supervisor may:

```text
Approve Quantity Variance
Approve Alternate Carton
Approve Shipment Release
```

---

### Audit Requirement

Must record:

```text
Supervisor
Reason
Timestamp
```

---

## Complete LPN Lifecycle

### Pick LPN

```text
CREATED
 ↓
PICK_IN_PROGRESS
 ↓
PICKED
 ↓
NESTED
 ↓
CONSUMED
```

---

### Shipping Carton LPN

```text
CREATED
 ↓
OPEN
 ↓
PACKED
 ↓
STAGED
 ↓
LOADED
 ↓
SHIPPED
```

---

## Shipment Lifecycle

```text
OPEN
 ↓
ALLOCATED
 ↓
PICKING
 ↓
PACKING
 ↓
READY_FOR_SHIPMENT
 ↓
SHIPPED
```

---

## Pack Station Lifecycle

```text
AVAILABLE
 ↓
ASSIGNED
 ↓
ACTIVE
 ↓
RELEASED
```

---

## Audit Trail

Every packing action records:

```text
Operator
Station
Carton
Shipment
Timestamp
```

and

```text
Inventory Movement
```

from

```text
Pick LPN
```

to

```text
Shipping Carton
```

---

## What Breaks If Audit Trail Removed

Warehouse loses ability to determine:

```text
Who packed order
What inventory moved
When shipment was packed
```

This becomes critical during:

- Customer claims
- Inventory investigations
- Regulatory audits

---

## Manhattan Best Practices

1. Use cartonization before packing.
2. Require carton close before label generation.
3. Capture actual weight.
4. Consume pick LPNs after successful packing.
5. Prevent shipment release until all cartons are packed.
6. Track carton hierarchy for multi-carton shipments.

---

# End of Packing Part 3

Packing document complete (first authoring pass).

Next Document:

Inbound Receiving
