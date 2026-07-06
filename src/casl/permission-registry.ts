import { WmsAction, WmsSubjects } from './casl.types';

export interface PermissionEntry {
  action: WmsAction;
  subject: WmsSubjects;
}

export interface WmsRoleDefinition {
  roleCode: string;
  permissions: PermissionEntry[];
}

export const WMS_ROLE_DEFINITIONS: WmsRoleDefinition[] = [
  {
    roleCode: 'WAREHOUSE_ADMIN',
    permissions: [
      { action: WmsAction.Manage, subject: 'all' },
    ],
  },
  {
    roleCode: 'WAREHOUSE_SUPERVISOR',
    permissions: [
      { action: WmsAction.Read, subject: 'all' },
      { action: WmsAction.Update, subject: 'Product' },
      { action: WmsAction.Approve, subject: 'Adjustment' },
      { action: WmsAction.Approve, subject: 'CycleCount' },
      { action: WmsAction.Approve, subject: 'Task' },
      { action: WmsAction.Adjust, subject: 'Inventory' },
      { action: WmsAction.Count, subject: 'CycleCount' },
      { action: WmsAction.Receive, subject: 'PurchaseOrder' },
      { action: WmsAction.Pick, subject: 'SalesOrder' },
      { action: WmsAction.Pack, subject: 'SalesOrder' },
      { action: WmsAction.Ship, subject: 'SalesOrder' },
      { action: WmsAction.Receive, subject: 'GoodsReceipt' },
      { action: WmsAction.Receive, subject: 'LPN' },
      { action: WmsAction.ExecutePutaway, subject: 'PutawayTask' },
      { action: WmsAction.PerformQc, subject: 'QualityInspection' },
      { action: WmsAction.Release, subject: 'PickingWave' },
      { action: WmsAction.ShortPick, subject: 'PickingTask' },
      { action: WmsAction.Approve, subject: 'AdjustmentApproval' },
      { action: WmsAction.ManageCycleCountSchedule, subject: 'all' },
      { action: WmsAction.TriggerSync, subject: 'Integration' },
      { action: WmsAction.ViewWebhookLogs, subject: 'SyncWebhookLog' },
      { action: WmsAction.RegisterDevice, subject: 'Barcode' },
    ],
  },
  {
    roleCode: 'WAREHOUSE_OPERATOR',
    permissions: [
      { action: WmsAction.Read, subject: 'Product' },
      { action: WmsAction.Read, subject: 'Report' },
      { action: WmsAction.Read, subject: 'WarehouseFacility' },
      { action: WmsAction.Read, subject: 'WarehouseZone' },
      { action: WmsAction.Read, subject: 'StorageLocation' },
      { action: WmsAction.Read, subject: 'Inventory' },
      { action: WmsAction.Read, subject: 'SalesOrder' },
      { action: WmsAction.Read, subject: 'PurchaseOrder' },
      { action: WmsAction.Receive, subject: 'PurchaseOrder' },
      { action: WmsAction.Pick, subject: 'SalesOrder' },
      { action: WmsAction.Pack, subject: 'SalesOrder' },
      { action: WmsAction.Ship, subject: 'SalesOrder' },
      { action: WmsAction.Adjust, subject: 'Inventory' },
      { action: WmsAction.Transact, subject: 'Inventory' },
      { action: WmsAction.Pick, subject: 'PickingTask' },
      { action: WmsAction.Pack, subject: 'PackingSession' },
      { action: WmsAction.ExecuteCycleCount, subject: 'CycleCount' },
      { action: WmsAction.InitiateTransfer, subject: 'InventoryTransfer' },
      { action: WmsAction.ReceiveTransfer, subject: 'InventoryTransfer' },
      { action: WmsAction.Validate, subject: 'Barcode' },
      { action: WmsAction.Lookup, subject: 'Product' },
      { action: WmsAction.Lookup, subject: 'StorageLocation' },
      { action: WmsAction.Lookup, subject: 'LPN' },
    ],
  },
  {
    roleCode: 'SYSTEM_ADMIN',
    permissions: [
      { action: WmsAction.Manage, subject: 'all' },
    ],
  },
  {
    roleCode: 'SCANNER_USER',
    permissions: [
      { action: WmsAction.Validate, subject: 'Barcode' },
      { action: WmsAction.Lookup, subject: 'Product' },
      { action: WmsAction.Lookup, subject: 'StorageLocation' },
      { action: WmsAction.Lookup, subject: 'LPN' },
      { action: WmsAction.Lookup, subject: 'Inventory' },
      { action: WmsAction.Read, subject: 'Product' },
      { action: WmsAction.Read, subject: 'StorageLocation' },
    ],
  },
  {
    roleCode: 'INVENTORY_CLERK',
    permissions: [
      { action: WmsAction.Read, subject: 'Product' },
      { action: WmsAction.Create, subject: 'Product' },
      { action: WmsAction.Read, subject: 'StorageLocation' },
      { action: WmsAction.Read, subject: 'Inventory' },
      { action: WmsAction.Count, subject: 'CycleCount' },
      { action: WmsAction.Adjust, subject: 'Inventory' },
      { action: WmsAction.Validate, subject: 'Barcode' },
      { action: WmsAction.Lookup, subject: 'Product' },
      { action: WmsAction.Lookup, subject: 'StorageLocation' },
      { action: WmsAction.Lookup, subject: 'LPN' },
    ],
  },
];

export const ALL_WMS_SUBJECTS: WmsSubjects[] = [
  'WarehouseFacility', 'WarehouseZone', 'StorageLocation', 'Product',
  'ProductCategory', 'UnitOfMeasure', 'ProductAttribute', 'ProductBarcode',
  'Inventory', 'LPN', 'SalesOrder', 'PurchaseOrder', 'Task', 'CycleCount',
  'Adjustment', 'Report', 'InventoryOnHand', 'InventoryTransaction',
  'InventoryLot', 'InventoryHold', 'InventoryAdjustment', 'InventoryPolicy',
  'AdvanceShipNotice', 'GoodsReceipt', 'PutawayTask', 'InventoryAllocation',
  'PickingWave', 'PickingTask', 'PackingSession', 'PackingContainer',
  'OutboundShipment', 'InventoryTransfer', 'InventoryTransferLine',
  'CycleCountLine', 'AdjustmentApproval', 'ApprovalThresholdConfig',
  'SystemSetting', 'Replenishment', 'Integration', 'Barcode',
  'ExternalEntityMapping', 'IntegrationSyncLog', 'SyncWebhookLog',
  'VasServiceCatalog', 'VasWorkstation', 'QualityInspection',
  'ComplianceRequirement', 'ComplianceAudit', 'HazmatMaterial',
  'StorageRateMaster', 'StorageClientRate', 'BillingCycle',
  'StorageInventorySnapshot', 'StorageCharge', 'ClientInvoice',
  'DockAppointment', 'YardVehicle', 'LaborShift', 'LaborShiftAssignment',
  'LaborTimeLog', 'LaborPerformanceMetric', 'WarehouseEquipment',
  'EquipmentMaintenance', 'WorkOrder', 'WorkOrderOperation',
  'WorkOrderComponent', 'ExceptionManagement', 'ExceptionComment',
  'ExceptionEscalationRule', 'WarehouseEvent', 'SystemAuditLog',
  'DailyKpiMetric', 'LocationPickHeatmap', 'FulfillmentWorkflowEvent',
  'FulfillmentWorkflowTransition', 'FulfillmentBillingRun',
  'FulfillmentBillingEvent', 'RfSession', 'SupervisorPin', 'ResourceQuota', 'Quota',
  'CartonizationRule', 'PackingException', 'StagingLane', 'Trailer', 'Manifest',
];

export const ALL_WMS_ACTIONS: WmsAction[] = Object.values(WmsAction);
