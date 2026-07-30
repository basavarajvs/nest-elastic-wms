import { DomainEvent } from '../domain-event';

export class InspectionPassedEvent extends DomainEvent {
  readonly inspection_id: bigint;
  readonly grn_id?: bigint;
  readonly product_id?: bigint;
  readonly approved_by: string;
  readonly disposition?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    inspection_id: bigint;
    grn_id?: bigint;
    product_id?: bigint;
    approved_by: string;
    disposition?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.inspection_id = params.inspection_id;
    this.grn_id = params.grn_id;
    this.product_id = params.product_id;
    this.approved_by = params.approved_by;
    this.disposition = params.disposition;
  }
}

export class InspectionFailedEvent extends DomainEvent {
  readonly inspection_id: bigint;
  readonly grn_id?: bigint;
  readonly product_id?: bigint;
  readonly rejected_by: string;
  readonly reason?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    inspection_id: bigint;
    grn_id?: bigint;
    product_id?: bigint;
    rejected_by: string;
    reason?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.inspection_id = params.inspection_id;
    this.grn_id = params.grn_id;
    this.product_id = params.product_id;
    this.rejected_by = params.rejected_by;
    this.reason = params.reason;
  }
}

export class QualityHoldCreatedEvent extends DomainEvent {
  readonly hold_id: bigint;
  readonly product_id?: bigint;
  readonly location_id?: bigint;
  readonly reason: string;
  readonly created_by: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    hold_id: bigint;
    product_id?: bigint;
    location_id?: bigint;
    reason: string;
    created_by: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.hold_id = params.hold_id;
    this.product_id = params.product_id;
    this.location_id = params.location_id;
    this.reason = params.reason;
    this.created_by = params.created_by;
  }
}

export class HoldReleasedEvent extends DomainEvent {
  readonly hold_id: bigint;
  readonly product_id?: bigint;
  readonly released_by: string;
  readonly reason?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    hold_id: bigint;
    product_id?: bigint;
    released_by: string;
    reason?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.hold_id = params.hold_id;
    this.product_id = params.product_id;
    this.released_by = params.released_by;
    this.reason = params.reason;
  }
}

export class NcrCreatedEvent extends DomainEvent {
  readonly ncr_id: bigint;
  readonly product_id?: bigint;
  readonly description: string;
  readonly severity: string;
  readonly created_by: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    ncr_id: bigint;
    product_id?: bigint;
    description: string;
    severity: string;
    created_by: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.ncr_id = params.ncr_id;
    this.product_id = params.product_id;
    this.description = params.description;
    this.severity = params.severity;
    this.created_by = params.created_by;
  }
}
