# Document 6 – Inventory Cycle Count (Part 2)
# Manhattan WMS RF Operations Guide

## ABC Counting Strategy

### Why ABC Counting Exists

Not all inventory has equal business value.

Example:

```text
SKU-A
Annual Movement: 100,000

SKU-B
Annual Movement: 500
```

Counting frequency should differ.

---

## A Items

Characteristics:

```text
High Value
High Movement
High Business Impact
```

Typical Count Frequency:

```text
Weekly
```

---

## B Items

Characteristics:

```text
Moderate Value
Moderate Movement
```

Typical Count Frequency:

```text
Monthly
```

---

## C Items

Characteristics:

```text
Low Value
Low Movement
```

Typical Count Frequency:

```text
Quarterly
```

---

## Recount Logic

### Scenario

System Quantity:

```text
100
```

Physical Quantity:

```text
95
```

Variance:

```text
-5
```

---

### Why Recount Exists

Humans make counting mistakes.

The first count may be wrong.

---

### Manhattan Behavior

Large variances may automatically create:

```text
Recount Task
```

assigned to another operator.

---

## Variance Thresholds

### Example

Warehouse Rule:

```text
Variance <= 2
```

Auto Approve

Variance > 2

Supervisor Review

---

### Why This Exists

Small discrepancies may not justify investigation.

Large discrepancies require analysis.

---

## Inventory Adjustments

### Scenario

Expected:

```text
100
```

Actual:

```text
95
```

Approved Result:

```text
Adjust Inventory
to 95
```

---

### Why This Exists

System inventory must match physical inventory.

---

## LPN Counting

### What User Does

Scans:

```text
LPN-1001
```

Verifies contents.

---

### Why Use LPN Counts

Faster than counting individual inventory.

Useful for pallet-controlled warehouses.

---

## Location Counting

### What User Does

Counts everything stored in location.

Example:

```text
A-01-01-01
```

---

### Why Use Location Counts

Validates entire storage location.

---

## Root Cause Analysis

### Why Variances Occur

Examples:

```text
Receiving Error
Picking Error
Damage
Theft
Misplaced Inventory
```

---

### Warehouse Reality

Counting identifies symptoms.

Investigation identifies causes.

---

## Supervisor Review

Required For:

```text
Large Variances
Repeated Variances
Sensitive Inventory
```

---

### Supervisor Actions

```text
Approve
Reject
Request Recount
Launch Investigation
```

---

## Audit Trail

Capture:

```text
Counter
Location
LPN
Expected Quantity
Actual Quantity
Variance
Timestamp
```

---

## Compliance Importance

Many industries require:

```text
Inventory Accuracy Evidence
```

Examples:

- Pharmaceutical
- Medical Device
- Food
- Aerospace

---

## Task Lifecycle

```text
CREATED
 ↓
READY
 ↓
ASSIGNED
 ↓
COUNTED
 ↓
APPROVED
 ↓
CLOSED
```

---

## Inventory Impact

No Variance:

```text
Inventory Unchanged
```

Variance Approved:

```text
Inventory Adjusted
```

---

## Manhattan Best Practices

1. Use blind counting whenever possible.
2. Count A-items more frequently.
3. Require recounts for large variances.
4. Track root causes.
5. Separate counting from adjustment approval.
6. Maintain full audit history.

---

# End of Cycle Count Document

Next:
Outbound Shipping
