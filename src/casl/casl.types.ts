import { MongoAbility } from '@casl/ability';

export enum WmsAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  List = 'list',
  Receive = 'receive',
  ExecutePutaway = 'executePutaway',
  PerformQc = 'performQc',
  Pick = 'pick',
  Pack = 'pack',
  Ship = 'ship',
  Release = 'release',
  ShortPick = 'shortPick',
  Reallocate = 'reallocate',
  Cancel = 'cancel',
  Adjust = 'adjust',
  Count = 'count',
  Approve = 'approve',
  Transact = 'transact',
  InitiateTransfer = 'initiateTransfer',
  ReceiveTransfer = 'receiveTransfer',
  ExecuteCycleCount = 'executeCycleCount',
  ApproveAdjustment = 'approveAdjustment',
  ManageCycleCountSchedule = 'manageCycleCountSchedule',
  OverrideApproval = 'overrideApproval',
  Validate = 'validate',
  Lookup = 'lookup',
  TriggerSync = 'triggerSync',
  ViewWebhookLogs = 'viewWebhookLogs',
  RegisterDevice = 'registerDevice',
}

export type WmsSubjects =
  | 'WarehouseFacility'
  | 'WarehouseZone'
  | 'StorageLocation'
  | 'Product'
  | 'ProductCategory'
  | 'UnitOfMeasure'
  | 'ProductAttribute'
  | 'ProductBarcode'
  | 'Inventory'
  | 'PurchaseOrder'
  | 'Task'
  | 'CycleCount'
  | 'Adjustment'
  | 'Report'
  | 'InventoryOnHand'
  | 'InventoryTransaction'
  | 'InventoryLot'
  | 'InventoryHold'
  | 'InventoryAdjustment'
  | 'InventoryPolicy'
  | 'AdvanceShipNotice'
  | 'GoodsReceipt'
  | 'LPN'
  | 'PutawayTask'
  | 'Inspection'
  | 'QcDisposition'
  | 'SalesOrder'
  | 'InventoryAllocation'
  | 'PickingWave'
  | 'PickingTask'
  | 'PackingSession'
  | 'PackingContainer'
  | 'OutboundShipment'
  | 'InventoryTransfer'
  | 'InventoryTransferLine'
  | 'CycleCountLine'
  | 'AdjustmentApproval'
  | 'ApprovalThresholdConfig'
  | 'SystemSetting'
  | 'WmsStateMachine'
  | 'WmsRule'
  | 'WmsBpmnProcess'
  | 'WmsExecutionInstance'
  | 'Replenishment'
  | 'VasServiceCatalog'
  | 'VasWorkstation'
  | 'QualityInspection'
  | 'ComplianceRequirement'
  | 'ComplianceAudit'
  | 'HazmatMaterial'
  | 'Integration'
  | 'Barcode'
  | 'ExternalEntityMapping'
  | 'IntegrationSyncLog'
  | 'SyncWebhookLog'
  | 'all';

export type WmsAbility = MongoAbility<[WmsAction, WmsSubjects]>;
