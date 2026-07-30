import { DomainEvent } from '../domain-event';

export class InventoryAdjustedEvent extends DomainEvent {
  readonly adjustment_id: bigint;
  readonly product_id: bigint;
  readonly location_id: bigint;
  readonly old_quantity: number;
  readonly new_quantity: number;
  readonly reason?: string;
  readonly approved_by: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    adjustment_id: bigint;
    product_id: bigint;
    location_id: bigint;
    old_quantity: number;
    new_quantity: number;
    reason?: string;
    approved_by: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.adjustment_id = params.adjustment_id;
    this.product_id = params.product_id;
    this.location_id = params.location_id;
    this.old_quantity = params.old_quantity;
    this.new_quantity = params.new_quantity;
    this.reason = params.reason;
    this.approved_by = params.approved_by;
  }
}

export class InventoryReservedEvent extends DomainEvent {
  readonly allocation_id: bigint;
  readonly order_id: bigint;
  readonly order_line_id: bigint;
  readonly product_id: bigint;
  readonly quantity: number;
  readonly location_id: bigint;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    allocation_id: bigint;
    order_id: bigint;
    order_line_id: bigint;
    product_id: bigint;
    quantity: number;
    location_id: bigint;
  }) {
    super(params.tenant_id, params.facility_id);
    this.allocation_id = params.allocation_id;
    this.order_id = params.order_id;
    this.order_line_id = params.order_line_id;
    this.product_id = params.product_id;
    this.quantity = params.quantity;
    this.location_id = params.location_id;
  }
}

export class InventoryMovedEvent extends DomainEvent {
  readonly transfer_id: bigint;
  readonly transfer_number: string;
  readonly product_id: bigint;
  readonly quantity: number;
  readonly from_location_id: bigint;
  readonly to_location_id: bigint;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    transfer_id: bigint;
    transfer_number: string;
    product_id: bigint;
    quantity: number;
    from_location_id: bigint;
    to_location_id: bigint;
  }) {
    super(params.tenant_id, params.facility_id);
    this.transfer_id = params.transfer_id;
    this.transfer_number = params.transfer_number;
    this.product_id = params.product_id;
    this.quantity = params.quantity;
    this.from_location_id = params.from_location_id;
    this.to_location_id = params.to_location_id;
  }
}

export class OrderAllocatedEvent extends DomainEvent {
  readonly order_id: bigint;
  readonly order_number: string;
  readonly total_short: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    order_id: bigint;
    order_number: string;
    total_short: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.order_id = params.order_id;
    this.order_number = params.order_number;
    this.total_short = params.total_short;
  }
}

export class CycleCountCompletedEvent extends DomainEvent {
  readonly count_id: bigint;
  readonly count_number: string;
  readonly product_id: bigint;
  readonly location_id: bigint;
  readonly expected_quantity: number;
  readonly counted_quantity: number;
  readonly variance: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    count_id: bigint;
    count_number: string;
    product_id: bigint;
    location_id: bigint;
    expected_quantity: number;
    counted_quantity: number;
    variance: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.count_id = params.count_id;
    this.count_number = params.count_number;
    this.product_id = params.product_id;
    this.location_id = params.location_id;
    this.expected_quantity = params.expected_quantity;
    this.counted_quantity = params.counted_quantity;
    this.variance = params.variance;
  }
}

export class CycleCountVarianceDetectedEvent extends DomainEvent {
  readonly count_id: bigint;
  readonly line_id: bigint;
  readonly product_id: bigint;
  readonly expected_quantity: number;
  readonly counted_quantity: number;
  readonly variance: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    count_id: bigint;
    line_id: bigint;
    product_id: bigint;
    expected_quantity: number;
    counted_quantity: number;
    variance: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.count_id = params.count_id;
    this.line_id = params.line_id;
    this.product_id = params.product_id;
    this.expected_quantity = params.expected_quantity;
    this.counted_quantity = params.counted_quantity;
    this.variance = params.variance;
  }
}
