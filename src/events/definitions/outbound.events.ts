import { DomainEvent } from '../domain-event';

export class OrderShippedEvent extends DomainEvent {
  readonly order_id: bigint;
  readonly order_number: string;
  readonly shipment_id: bigint;
  readonly tracking_number?: string;
  readonly shipped_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    order_id: bigint;
    order_number: string;
    shipment_id: bigint;
    tracking_number?: string;
    shipped_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.order_id = params.order_id;
    this.order_number = params.order_number;
    this.shipment_id = params.shipment_id;
    this.tracking_number = params.tracking_number;
    this.shipped_by = params.shipped_by;
  }
}

export class WaveCreatedEvent extends DomainEvent {
  readonly wave_id: bigint;
  readonly wave_number: string;
  readonly wave_type?: string;
  readonly order_count: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    wave_id: bigint;
    wave_number: string;
    wave_type?: string;
    order_count: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.wave_id = params.wave_id;
    this.wave_number = params.wave_number;
    this.wave_type = params.wave_type;
    this.order_count = params.order_count;
  }
}

export class WaveReleasedEvent extends DomainEvent {
  readonly wave_id: bigint;
  readonly wave_number: string;
  readonly order_count: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    wave_id: bigint;
    wave_number: string;
    order_count: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.wave_id = params.wave_id;
    this.wave_number = params.wave_number;
    this.order_count = params.order_count;
  }
}

export class WaveCompletedEvent extends DomainEvent {
  readonly wave_id: bigint;
  readonly wave_number: string;
  readonly completed_tasks: number;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    wave_id: bigint;
    wave_number: string;
    completed_tasks: number;
  }) {
    super(params.tenant_id, params.facility_id);
    this.wave_id = params.wave_id;
    this.wave_number = params.wave_number;
    this.completed_tasks = params.completed_tasks;
  }
}

export class WaveCancelledEvent extends DomainEvent {
  readonly wave_id: bigint;
  readonly wave_number: string;
  readonly cancelled_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    wave_id: bigint;
    wave_number: string;
    cancelled_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.wave_id = params.wave_id;
    this.wave_number = params.wave_number;
    this.cancelled_by = params.cancelled_by;
  }
}

export class PickTaskAssignedEvent extends DomainEvent {
  readonly task_id: bigint;
  readonly task_number: string;
  readonly user_id: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    task_id: bigint;
    task_number: string;
    user_id: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.task_id = params.task_id;
    this.task_number = params.task_number;
    this.user_id = params.user_id;
  }
}

export class PickTaskCompletedEvent extends DomainEvent {
  readonly task_id: bigint;
  readonly task_number: string;
  readonly order_id?: bigint;
  readonly wave_id?: bigint;
  readonly product_id?: bigint;
  readonly quantity_picked: number;
  readonly quantity_shorted?: number;
  readonly completed_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    task_id: bigint;
    task_number: string;
    order_id?: bigint;
    wave_id?: bigint;
    product_id?: bigint;
    quantity_picked: number;
    quantity_shorted?: number;
    completed_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.task_id = params.task_id;
    this.task_number = params.task_number;
    this.order_id = params.order_id;
    this.wave_id = params.wave_id;
    this.product_id = params.product_id;
    this.quantity_picked = params.quantity_picked;
    this.quantity_shorted = params.quantity_shorted;
    this.completed_by = params.completed_by;
  }
}

export class PickTaskShortEvent extends DomainEvent {
  readonly task_id: bigint;
  readonly task_number: string;
  readonly order_id?: bigint;
  readonly product_id?: bigint;
  readonly quantity_short: number;
  readonly reason?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    task_id: bigint;
    task_number: string;
    order_id?: bigint;
    product_id?: bigint;
    quantity_short: number;
    reason?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.task_id = params.task_id;
    this.task_number = params.task_number;
    this.order_id = params.order_id;
    this.product_id = params.product_id;
    this.quantity_short = params.quantity_short;
    this.reason = params.reason;
  }
}

export class CartonPackedEvent extends DomainEvent {
  readonly carton_id: bigint;
  readonly session_id: bigint;
  readonly order_id?: bigint;
  readonly items_packed: number;
  readonly packed_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    carton_id: bigint;
    session_id: bigint;
    order_id?: bigint;
    items_packed: number;
    packed_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.carton_id = params.carton_id;
    this.session_id = params.session_id;
    this.order_id = params.order_id;
    this.items_packed = params.items_packed;
    this.packed_by = params.packed_by;
  }
}

export class ShipmentStagedEvent extends DomainEvent {
  readonly shipment_id: bigint;
  readonly shipment_number: string;
  readonly staging_location_id: bigint;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    shipment_id: bigint;
    shipment_number: string;
    staging_location_id: bigint;
  }) {
    super(params.tenant_id, params.facility_id);
    this.shipment_id = params.shipment_id;
    this.shipment_number = params.shipment_number;
    this.staging_location_id = params.staging_location_id;
  }
}

export class ShipmentLoadedEvent extends DomainEvent {
  readonly shipment_id: bigint;
  readonly shipment_number: string;
  readonly load_id?: bigint;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    shipment_id: bigint;
    shipment_number: string;
    load_id?: bigint;
  }) {
    super(params.tenant_id, params.facility_id);
    this.shipment_id = params.shipment_id;
    this.shipment_number = params.shipment_number;
    this.load_id = params.load_id;
  }
}

export class ShipmentDispatchedEvent extends DomainEvent {
  readonly shipment_id: bigint;
  readonly shipment_number: string;
  readonly order_id?: bigint;
  readonly order_number?: string;
  readonly tracking_number?: string;
  readonly shipped_by?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    shipment_id: bigint;
    shipment_number: string;
    order_id?: bigint;
    order_number?: string;
    tracking_number?: string;
    shipped_by?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.shipment_id = params.shipment_id;
    this.shipment_number = params.shipment_number;
    this.order_id = params.order_id;
    this.order_number = params.order_number;
    this.tracking_number = params.tracking_number;
    this.shipped_by = params.shipped_by;
  }
}

export class LoadCreatedEvent extends DomainEvent {
  readonly load_id: bigint;
  readonly load_number: string;
  readonly carrier_name?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    load_id: bigint;
    load_number: string;
    carrier_name?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.load_id = params.load_id;
    this.load_number = params.load_number;
    this.carrier_name = params.carrier_name;
  }
}

export class LoadStartedEvent extends DomainEvent {
  readonly load_id: bigint;
  readonly load_number: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    load_id: bigint;
    load_number: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.load_id = params.load_id;
    this.load_number = params.load_number;
  }
}

export class LoadCompletedEvent extends DomainEvent {
  readonly load_id: bigint;
  readonly load_number: string;
  readonly loaded_cartons?: number;
  readonly seal_number?: string;
  readonly bol_number?: string;
  readonly pro_number?: string;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    load_id: bigint;
    load_number: string;
    loaded_cartons?: number;
    seal_number?: string;
    bol_number?: string;
    pro_number?: string;
  }) {
    super(params.tenant_id, params.facility_id);
    this.load_id = params.load_id;
    this.load_number = params.load_number;
    this.loaded_cartons = params.loaded_cartons;
    this.seal_number = params.seal_number;
    this.bol_number = params.bol_number;
    this.pro_number = params.pro_number;
  }
}

export class LoadDepartedEvent extends DomainEvent {
  readonly load_id: bigint;
  readonly load_number: string;
  readonly actual_departure_time?: Date;

  constructor(params: {
    tenant_id: string;
    facility_id?: bigint;
    load_id: bigint;
    load_number: string;
    actual_departure_time?: Date;
  }) {
    super(params.tenant_id, params.facility_id);
    this.load_id = params.load_id;
    this.load_number = params.load_number;
    this.actual_departure_time = params.actual_departure_time;
  }
}
