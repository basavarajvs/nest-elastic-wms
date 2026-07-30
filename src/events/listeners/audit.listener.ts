import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../../common/audit/audit.service';
import { AsnStatusChangedEvent } from '../definitions/inbound.events';
import { ReceivingStartedEvent, ReceivingCompletedEvent } from '../definitions/inbound.events';
import { PutawayCompletedEvent } from '../definitions/inbound.events';
import { InspectionPassedEvent, InspectionFailedEvent } from '../definitions/quality.events';
import { QualityHoldCreatedEvent, HoldReleasedEvent, NcrCreatedEvent } from '../definitions/quality.events';
import { InventoryAdjustedEvent, InventoryMovedEvent, InventoryReservedEvent, OrderAllocatedEvent } from '../definitions/inventory.events';
import { CycleCountCompletedEvent } from '../definitions/inventory.events';
import { OrderShippedEvent } from '../definitions/outbound.events';
import { WaveCreatedEvent, WaveReleasedEvent, WaveCompletedEvent, WaveCancelledEvent } from '../definitions/outbound.events';
import { PickTaskAssignedEvent, PickTaskCompletedEvent, PickTaskShortEvent } from '../definitions/outbound.events';
import { CartonPackedEvent } from '../definitions/outbound.events';
import { ShipmentStagedEvent, ShipmentLoadedEvent, ShipmentDispatchedEvent } from '../definitions/outbound.events';
import { LoadCreatedEvent, LoadStartedEvent, LoadCompletedEvent, LoadDepartedEvent } from '../definitions/outbound.events';

@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(private readonly audit: AuditService) {}

  @OnEvent('asn.status_changed')
  async handleAsnStatusChanged(event: AsnStatusChangedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: `ASN_STATUS_CHANGED: ${event.old_status} -> ${event.new_status}`,
      tableName: 'advance_ship_notices',
      recordId: event.asn_id.toString(),
      newValue: { status: event.new_status, changed_by: event.changed_by },
      notes: `ASN ${event.asn_number} status changed`,
    });
  }

  @OnEvent('receiving.started')
  async handleReceivingStarted(event: ReceivingStartedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'RECEIVING_STARTED',
      tableName: 'goods_receipts',
      recordId: event.receipt_id.toString(),
      notes: `Receipt ${event.receipt_number}`,
    });
  }

  @OnEvent('receiving.completed')
  async handleReceivingCompleted(event: ReceivingCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'RECEIVING_COMPLETED',
      tableName: 'goods_receipts',
      recordId: event.receipt_id.toString(),
      newValue: { total_lines: event.total_lines, received_lines: event.received_lines },
      notes: `Receipt ${event.receipt_number} completed`,
    });
  }

  @OnEvent('putaway.completed')
  async handlePutawayCompleted(event: PutawayCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'PUTAWAY_COMPLETED',
      tableName: 'putaway_tasks',
      recordId: event.putaway_task_id.toString(),
      newValue: { product_id: event.product_id.toString(), location_id: event.location_id.toString(), quantity: event.quantity },
      notes: `Product ${event.product_id} -> Location ${event.location_id}`,
    });
  }

  @OnEvent('inspection.passed')
  async handleInspectionPassed(event: InspectionPassedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'INSPECTION_PASSED',
      tableName: 'inspections',
      recordId: event.inspection_id.toString(),
      notes: `Disposition: ${event.disposition || 'N/A'}`,
    });
  }

  @OnEvent('inspection.failed')
  async handleInspectionFailed(event: InspectionFailedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'INSPECTION_FAILED',
      tableName: 'inspections',
      recordId: event.inspection_id.toString(),
      notes: `Reason: ${event.reason || 'N/A'}`,
    });
  }

  @OnEvent('hold.created')
  async handleHoldCreated(event: QualityHoldCreatedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'HOLD_CREATED',
      tableName: 'quality_holds',
      recordId: event.hold_id.toString(),
      notes: `Reason: ${event.reason}`,
    });
  }

  @OnEvent('hold.released')
  async handleHoldReleased(event: HoldReleasedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'HOLD_RELEASED',
      tableName: 'quality_holds',
      recordId: event.hold_id.toString(),
      notes: `Reason: ${event.reason || 'N/A'}`,
    });
  }

  @OnEvent('ncr.created')
  async handleNcrCreated(event: NcrCreatedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'NCR_CREATED',
      tableName: 'ncrs',
      recordId: event.ncr_id.toString(),
      newValue: { severity: event.severity, description: event.description },
    });
  }

  @OnEvent('inventory.adjusted')
  async handleInventoryAdjusted(event: InventoryAdjustedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'INVENTORY_ADJUSTED',
      tableName: 'inventory_adjustments',
      recordId: event.adjustment_id.toString(),
      oldValue: { quantity: event.old_quantity },
      newValue: { quantity: event.new_quantity },
      notes: `Product ${event.product_id} @ Location ${event.location_id}`,
    });
  }

  @OnEvent('adjustment.auto_approved')
  async handleAdjustmentAutoApproved(event: { tenant_id: string; request_id: bigint; facility_id?: bigint }) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'AUTO_APPROVE_ADJUSTMENT',
      tableName: 'adjustment_approval_requests',
      recordId: event.request_id.toString(),
      notes: 'Auto-approved below threshold',
    });
  }

  @OnEvent('inventory.moved')
  async handleInventoryMoved(event: InventoryMovedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'INVENTORY_MOVED',
      tableName: 'transfers',
      recordId: event.transfer_id.toString(),
      notes: `Transfer ${event.transfer_number}: ${event.from_location_id} -> ${event.to_location_id}`,
    });
  }

  @OnEvent('cycle_count.completed')
  async handleCycleCountCompleted(event: CycleCountCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'CYCLE_COUNT_COMPLETED',
      tableName: 'cycle_counts',
      recordId: event.count_id.toString(),
      oldValue: { quantity: event.expected_quantity },
      newValue: { quantity: event.counted_quantity },
      notes: `Variance: ${event.variance}`,
    });
  }

  @OnEvent('inventory.reserved')
  async handleInventoryReserved(event: InventoryReservedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'INVENTORY_RESERVED',
      tableName: 'allocations',
      recordId: event.allocation_id.toString(),
      notes: `Order ${event.order_id}: Product ${event.product_id} x ${event.quantity}`,
    });
  }

  @OnEvent('order.allocated')
  async handleOrderAllocated(event: OrderAllocatedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'ORDER_ALLOCATED',
      tableName: 'sales_orders',
      recordId: event.order_id.toString(),
      notes: `Order ${event.order_number} allocated (short: ${event.total_short})`,
    });
  }

  @OnEvent('wave.created')
  async handleWaveCreated(event: WaveCreatedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'WAVE_CREATED',
      tableName: 'picking_waves',
      recordId: event.wave_id.toString(),
      notes: `Wave ${event.wave_number} (${event.order_count} orders)`,
    });
  }

  @OnEvent('wave.released')
  async handleWaveReleased(event: WaveReleasedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'WAVE_RELEASED',
      tableName: 'picking_waves',
      recordId: event.wave_id.toString(),
      notes: `Wave ${event.wave_number}`,
    });
  }

  @OnEvent('wave.completed')
  async handleWaveCompleted(event: WaveCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'WAVE_COMPLETED',
      tableName: 'picking_waves',
      recordId: event.wave_id.toString(),
      notes: `Wave ${event.wave_number} (${event.completed_tasks} tasks)`,
    });
  }

  @OnEvent('wave.cancelled')
  async handleWaveCancelled(event: WaveCancelledEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'WAVE_CANCELLED',
      tableName: 'picking_waves',
      recordId: event.wave_id.toString(),
      notes: `Wave ${event.wave_number}`,
    });
  }

  @OnEvent('pick_task.assigned')
  async handlePickTaskAssigned(event: PickTaskAssignedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'PICK_TASK_ASSIGNED',
      tableName: 'picking_tasks',
      recordId: event.task_id.toString(),
      notes: `Task ${event.task_number} -> User ${event.user_id}`,
    });
  }

  @OnEvent('pick_task.completed')
  async handlePickTaskCompleted(event: PickTaskCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'PICK_TASK_COMPLETED',
      tableName: 'picking_tasks',
      recordId: event.task_id.toString(),
      newValue: { quantity_picked: event.quantity_picked, quantity_shorted: event.quantity_shorted },
    });
  }

  @OnEvent('pick_task.short')
  async handlePickTaskShort(event: PickTaskShortEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'PICK_TASK_SHORT',
      tableName: 'picking_tasks',
      recordId: event.task_id.toString(),
      notes: `Short ${event.quantity_short} units. Reason: ${event.reason || 'N/A'}`,
    });
  }

  @OnEvent('carton.packed')
  async handleCartonPacked(event: CartonPackedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'CARTON_PACKED',
      tableName: 'packing_sessions',
      recordId: event.session_id.toString(),
      notes: `${event.items_packed} items packed`,
    });
  }

  @OnEvent('shipment.staged')
  async handleShipmentStaged(event: ShipmentStagedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'SHIPMENT_STAGED',
      tableName: 'outbound_shipments',
      recordId: event.shipment_id.toString(),
      notes: `Staged at location ${event.staging_location_id}`,
    });
  }

  @OnEvent('shipment.loaded')
  async handleShipmentLoaded(event: ShipmentLoadedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'SHIPMENT_LOADED',
      tableName: 'outbound_shipments',
      recordId: event.shipment_id.toString(),
      notes: `Shipment ${event.shipment_number} loaded`,
    });
  }

  @OnEvent('shipment.dispatched')
  async handleShipmentDispatched(event: ShipmentDispatchedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'SHIPMENT_DISPATCHED',
      tableName: 'outbound_shipments',
      recordId: event.shipment_id.toString(),
      notes: `Shipment ${event.shipment_number} dispatched`,
    });
  }

  @OnEvent('order.shipped')
  async handleOrderShipped(event: OrderShippedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'ORDER_SHIPPED',
      tableName: 'sales_orders',
      recordId: event.order_id.toString(),
      notes: `Order ${event.order_number} shipped via shipment ${event.shipment_id}`,
    });
  }

  @OnEvent('load.created')
  async handleLoadCreated(event: LoadCreatedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'LOAD_CREATED',
      tableName: 'loads',
      recordId: event.load_id.toString(),
      notes: `Load ${event.load_number}`,
    });
  }

  @OnEvent('load.started')
  async handleLoadStarted(event: LoadStartedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'LOAD_STARTED',
      tableName: 'loads',
      recordId: event.load_id.toString(),
      notes: `Load ${event.load_number}`,
    });
  }

  @OnEvent('load.completed')
  async handleLoadCompleted(event: LoadCompletedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'LOAD_COMPLETED',
      tableName: 'loads',
      recordId: event.load_id.toString(),
      notes: `Load ${event.load_number}`,
    });
  }

  @OnEvent('load.departed')
  async handleLoadDeparted(event: LoadDepartedEvent) {
    await this.audit.log({
      tenantId: event.tenant_id,
      action: 'LOAD_DEPARTED',
      tableName: 'loads',
      recordId: event.load_id.toString(),
      notes: `Load ${event.load_number} departed`,
    });
  }
}
