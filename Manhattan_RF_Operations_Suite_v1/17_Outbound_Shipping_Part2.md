# Document 7 – Outbound Shipping (Part 2)
# Manhattan WMS RF Operations Guide

## Load Management

### What Is A Load?

A load is a collection of shipments assigned to a trailer.

Example:

```text
LOAD-1001

Shipment A
Shipment B
Shipment C
```

---

### Why Loads Exist

Warehouses rarely load shipments individually.

Grouping shipments:

- Improves efficiency
- Simplifies carrier handoff
- Enables trailer planning

---

## Shipment Verification

### What User Sees

```text
Shipment Verified?
```

---

### What User Does

Verifies all cartons for shipment are present.

---

### Why This Exists

Prevents:

```text
Partial Shipments
Missing Cartons
Customer Complaints
```

---

### Warehouse Reality

A shipment may contain:

```text
20 cartons
```

Loading only:

```text
19 cartons
```

creates service failures.

---

## Missing Carton Scenario

### Example

Expected:

```text
CTN-001
CTN-002
CTN-003
```

Actual:

```text
CTN-001
CTN-002
```

---

### Manhattan Behavior

Load closure blocked.

Shipment remains incomplete.

---

### Why This Exists

A shipment should not leave the facility incomplete without approval.

---

## Wrong Truck Scenario

### Example

Carton assigned to:

```text
TRAILER-A
```

Operator attempts loading to:

```text
TRAILER-B
```

---

### What User Sees

```text
ERROR

Wrong Trailer
```

---

### Why This Exists

Shipping to incorrect destination creates costly recovery efforts.

---

### Manhattan Validation

Verify:

```text
Carton Load
=
Trailer Load
```

---

## Partial Load Scenario

### Warehouse Reality

Sometimes trailers depart before all inventory arrives.

---

### Example

Expected:

```text
100 Cartons
```

Loaded:

```text
95 Cartons
```

---

### Supervisor Decision

Options:

```text
Wait
Ship Partial
Reassign Shipment
```

---

## Manifesting

### What Is Manifesting?

Creation of official shipping record.

---

### Why It Exists

Carrier requires:

```text
Shipment Details
Weight
Carton Count
Tracking Information
```

---

### Warehouse Reality

Without manifesting:

```text
Carrier Cannot Bill
Carrier Cannot Track
```

---

## Carrier Handoff

### What User Does

Confirms trailer ready for departure.

---

### Why This Exists

Custody transfers from:

```text
Warehouse
```

to

```text
Carrier
```

---

### Domain Concept

Transfer Of Custody

Critical legal and operational event.

---

## Shipment Closure

### What User Sees

```text
Close Shipment?
```

---

### What User Does

Confirms all shipment requirements satisfied.

---

### Why This Exists

Prevents further inventory modifications.

---

## Load Closure

### What User Sees

```text
Close Load?
```

---

### What User Does

Confirms trailer complete.

---

### Why This Exists

Load becomes ready for dispatch.

---

## LPN Lifecycle

Shipping Carton:

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
READY_TO_SHIP
 ↓
SHIPPED
```

---

## Audit Trail

Capture:

```text
Operator
Trailer
Door
Load
Shipment
Carton
Timestamp
```

---

## Compliance Importance

Provides proof of:

```text
What shipped
When shipped
Who loaded it
```

---

## Manhattan Best Practices

1. Scan every carton.
2. Validate trailer before loading.
3. Block load closure when cartons missing.
4. Maintain complete manifest records.
5. Capture proof of loading.
6. Maintain custody transfer audit trail.

---

## End-to-End Example

```text
Packing Complete
       ↓
Stage Cartons
       ↓
Assign Load
       ↓
Assign Trailer
       ↓
Scan Cartons
       ↓
Load Trailer
       ↓
Manifest
       ↓
Close Load
       ↓
Ship
```

Result:

```text
Inventory Status:
SHIPPED

Carrier Responsible:
YES
```

---

# End of Shipping Document

This completes the first-pass Manhattan RF Operations Suite.
