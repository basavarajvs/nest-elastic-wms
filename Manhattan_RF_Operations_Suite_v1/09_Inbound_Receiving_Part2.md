# Document 3 – Inbound Receiving (Part 2)
# Manhattan WMS RF Operations Guide

## Step 7 – Create Receiving LPN

### What User Sees

```text
Create LPN?
Y/N
```

or

```text
Scan Existing LPN
```

---

### What User Does

Receiver either:

- Creates a new LPN
- Scans supplier pallet label
- Applies warehouse LPN label

Example:

```text
LPN-1001
```

---

### Why This Step Exists

The warehouse needs a container identifier.

Without an LPN:

```text
Inventory exists
but cannot be tracked
```

---

### Domain Concept

License Plate Number (LPN)

Represents a physical container.

Examples:

```text
Pallet
Carton
Tote
```

---

### Warehouse Reality

A truck may contain:

```text
10 pallets
```

Each pallet receives its own LPN.

This allows:

- Putaway
- Cycle Counting
- Picking
- Shipping

to operate independently.

---

### What Breaks If Removed

Inventory becomes location-only inventory.

Traceability becomes difficult.

---

## Step 8 – Pallet Receiving

### Example Scenario

Truck contains:

```text
10 Pallets

Each pallet
100 units
```

---

### What User Does

Receiver scans:

```text
Pallet Barcode
```

then confirms quantity.

---

### Why This Exists

Warehouse needs pallet-level visibility.

---

### Domain Concept

Pallet Controlled Inventory

Common in:

- Retail
- Consumer Goods
- Manufacturing

---

## Step 9 – Over Receipt

### Scenario

ASN Expected:

```text
500 units
```

Actual Received:

```text
550 units
```

---

### What User Sees

```text
Expected: 500
Received: 550

Continue?
```

---

### Why This Step Exists

Suppliers frequently ship extra inventory.

---

### Manhattan Validation

Check receipt tolerance.

Example:

```text
Tolerance:
10%
```

Allowed:

```text
500 ± 50
```

---

### Outcomes

If within tolerance:

```text
Accept
```

If outside tolerance:

```text
Supervisor Approval
```

required.

---

## Step 10 – Under Receipt

### Scenario

Expected:

```text
500
```

Received:

```text
480
```

---

### Why This Exists

Supplier shortages occur.

---

### Domain Concept

Receipt Variance

Expected quantity differs from actual quantity.

---

### Warehouse Reality

Most warehouses experience shortages daily.

---

### Manhattan Actions

- Record variance
- Update ASN
- Notify purchasing

---

## Step 11 – Damage Handling

### Scenario

Receiver notices:

```text
Crushed Pallet
Water Damage
Broken Packaging
```

---

### What User Sees

```text
Damage?
Y/N
```

---

### What User Does

Selects damage code.

---

### Why This Exists

Damaged inventory should not enter normal stock.

---

### Domain Concept

Receiving Exception

Inventory quality issue identified during receipt.

---

### Manhattan Actions

Inventory status becomes:

```text
QC_HOLD
```

or

```text
DAMAGED
```

---

## Step 12 – Stage Inventory

### What User Sees

```text
Move To Staging
```

Location:

```text
STAGE-01
```

---

### What User Does

Moves pallet from receiving dock to staging area.

---

### Why This Exists

Inventory is not immediately stored.

Additional processes may occur:

- Quality Inspection
- Putaway Planning
- Label Verification

---

### Warehouse Reality

Receiving docks must be cleared quickly.

Staging prevents dock congestion.

---

## ASN Lifecycle

```text
CREATED
 ↓
RELEASED
 ↓
IN_RECEIVING
 ↓
PARTIALLY_RECEIVED
 ↓
RECEIVED
 ↓
CLOSED
```

---

## Receiving LPN Lifecycle

```text
CREATED
 ↓
RECEIVED
 ↓
STAGED
 ↓
QC_HOLD (optional)
 ↓
PUTAWAY_PENDING
```

---

## Receiving Task Lifecycle

```text
CREATED
 ↓
IN_PROGRESS
 ↓
COMPLETED
```

---

## Supervisor Actions

Supervisor may:

```text
Approve Over Receipt
Approve Variance
Approve Damaged Receipt
```

---

## Audit Trail

Records:

```text
Trailer
ASN
Operator
LPN
Quantity
Timestamp
```

---

## What Breaks If Audit Removed

Cannot determine:

- Who received inventory
- When inventory arrived
- Why variances occurred

---

## Manhattan Best Practices

1. Receive by pallet whenever possible.
2. Create LPNs immediately.
3. Capture variances during receipt.
4. Route damaged inventory to hold status.
5. Move inventory to staging quickly.
6. Maintain ASN traceability.

---

# End of Receiving Part 2

Next:
Inbound Quality Inspection
