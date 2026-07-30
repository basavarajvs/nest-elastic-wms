import { DomainEvent } from '../domain-event';

export class AsnStatusChangedEvent extends DomainEvent {
  readonly asn_id: bigint;
  readonly asn_number: string;
  readonly old_status: string;
  readonly new_status: string;
  readonly changed_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    asn_id: bigint;
    asn_number: string;
    old_status: string;
    new_status: string;
    changed_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.asn_id = params.asn_id;
    this.asn_number = params.asn_number;
    this.old_status = params.old_status;
    this.new_status = params.new_status;
    this.changed_by = params.changed_by;
  }
}

export class ReceivingStartedEvent extends DomainEvent {
  readonly receipt_id: bigint;
  readonly receipt_number: string;
  readonly asn_id?: bigint;

  constructor(params: {
    tenant_id: string;
    facility_id: bigint;
    receipt_id: bigint;
    receipt_number: string;
    asn_id?: bigint;
  }) {
    super(params.tenant_id, params.facility_id);
    this.receipt_id = params.receipt_id;
    this.receipt_number = params.receipt_number;
    this.asn_id = params.asn_id;
  }
}

export class ReceivingCompletedEvent extends DomainEvent {
  readonly receipt_id: bigint;
  readonly receipt_number: string;
  readonly asn_id?: bigint;
  readonly total_lines: number;
  readonly received_lines: number;

  constructor(params: {
    tenant_id: string;
    facility_id: bigint;
    receipt_id: bigint;
    receipt_number: string;
    asn_id?: bigint;
    total_lines: number;
    received_lines: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.receipt_id = params.receipt_id;
    this.receipt_number = params.receipt_number;
    this.asn_id = params.asn_id;
    this.total_lines = params.total_lines;
    this.received_lines = params.received_lines;
  }
}

export class PutawayCompletedEvent extends DomainEvent {
  readonly putaway_task_id: bigint;
  readonly product_id: bigint;
  readonly location_id: bigint;
  readonly lpn_id?: bigint;
  readonly lpn_number?: string;
  readonly quantity: number;

  constructor(params: {
    tenant_id: string;
    facility_id: bigint;
    putaway_task_id: bigint;
    product_id: bigint;
    location_id: bigint;
    quantity: number;
    lpn_id?: bigint;
    lpn_number?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.putaway_task_id = params.putaway_task_id;
    this.product_id = params.product_id;
    this.location_id = params.location_id;
    this.quantity = params.quantity;
    this.lpn_id = params.lpn_id;
    this.lpn_number = params.lpn_number;
  }
}

export class GrnStatusChangedEvent extends DomainEvent {
  readonly grn_id: bigint;
  readonly grn_number: string;
  readonly old_status: string;
  readonly new_status: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    grn_id: bigint;
    grn_number: string;
    old_status: string;
    new_status: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.grn_id = params.grn_id;
    this.grn_number = params.grn_number;
    this.old_status = params.old_status;
    this.new_status = params.new_status;
  }
}
