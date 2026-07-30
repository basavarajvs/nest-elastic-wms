import { DomainEvent } from '../domain-event';

export class BillingCycleApprovedEvent extends DomainEvent {
  readonly billing_run_id: bigint;
  readonly approved_by: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    billing_run_id: bigint;
    approved_by: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.billing_run_id = params.billing_run_id;
    this.approved_by = params.approved_by;
  }
}
