export abstract class DomainEvent {
  readonly event_id: string;
  readonly occurred_at: Date;
  readonly tenant_id: string;
  readonly facility_id?: bigint;

  constructor(tenantId: string, facilityId?: bigint) {
    this.event_id = crypto.randomUUID();
    this.occurred_at = new Date();
    this.tenant_id = tenantId;
    this.facility_id = facilityId;
  }
}
