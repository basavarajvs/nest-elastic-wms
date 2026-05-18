import { z } from 'zod';

export enum WmsNotificationType {
  LOW_STOCK_ALERT = 'wms.low_stock_alert',
  STOCKOUT_CRITICAL = 'wms.stockout_critical',
  ORDER_STATUS_CHANGED = 'wms.order_status_changed',
  ASN_ARRIVED = 'wms.asn_arrived',
  GRN_COMPLETED = 'wms.grn_completed',
  QC_FAILED = 'wms.qc_failed',
  PUTAWAY_DELAYED = 'wms.putaway_delayed',
  CYCLE_COUNT_VARIANCE = 'wms.cycle_count_variance',
  RF_SESSION_TIMEOUT = 'wms.rf_session_timeout',
  SYSTEM_QUOTA_WARNING = 'wms.system_quota_warning',
  DAILY_KPI_REPORT = 'wms.daily_kpi_report',
  REPORT_READY = 'wms.report_ready',
}

export const lowStockSchema = z.object({
  productCode: z.string().min(1),
  currentQty: z.number(),
  reorderPoint: z.number(),
  locationCode: z.string().min(1),
});

export const stockoutCriticalSchema = z.object({
  productCode: z.string().min(1),
  currentQty: z.literal(0),
  locationCode: z.string().min(1),
  lastReceivedAt: z.string().optional(),
});

export const orderStatusChangedSchema = z.object({
  orderNumber: z.string().min(1),
  clientCode: z.string().min(1),
  status: z.string().min(1),
  itemsCount: z.number().int(),
  totalValue: z.number(),
  trackingNumber: z.string().optional(),
});

export const asnArrivedSchema = z.object({
  asnNumber: z.string().min(1),
  supplierName: z.string().min(1),
  expectedDate: z.string().min(1),
  itemCount: z.number().int(),
  dockAssignment: z.string().optional(),
});

export const grnCompletedSchema = z.object({
  grnNumber: z.string().min(1),
  supplierName: z.string().min(1),
  receivedQty: z.number(),
  putawayQueueCount: z.number().int(),
});

export const qcFailedSchema = z.object({
  grnNumber: z.string().min(1),
  supplierName: z.string().min(1),
  supplierLotNumber: z.string().min(1),
  defectCode: z.string().min(1),
  qtyRejected: z.number(),
});

export const putawayDelayedSchema = z.object({
  taskId: z.string().min(1),
  locationCode: z.string().min(1),
  delayMinutes: z.number().int(),
});

export const cycleCountVarianceSchema = z.object({
  countNumber: z.string().min(1),
  productCode: z.string().min(1),
  locationCode: z.string().min(1),
  systemQuantity: z.number(),
  countedQuantity: z.number(),
  variancePercentage: z.number(),
});

export const rfSessionTimeoutSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  workflow: z.string().min(1),
  idleMinutes: z.number().int(),
  hadTask: z.boolean(),
});

export const systemQuotaWarningSchema = z.object({
  resourceType: z.string().min(1),
  usagePercent: z.number().min(0).max(100),
  limitAmount: z.number(),
  currentUsage: z.number(),
});

export const dailyKpiReportSchema = z.object({
  date: z.string().min(1),
  ordersShipped: z.number().int(),
  receiptsProcessed: z.number().int(),
  picksCompleted: z.number().int(),
  cycleCountsDone: z.number().int(),
  accuracyRate: z.number(),
});

export const reportReadySchema = z.object({
  reportType: z.string().min(1),
  jobId: z.string().min(1),
  rowCount: z.number().int(),
  fileSizeMb: z.number(),
  downloadUrl: z.string().min(1),
});

export const NOTIFICATION_SCHEMAS: Record<string, z.ZodSchema> = {
  [WmsNotificationType.LOW_STOCK_ALERT]: lowStockSchema,
  [WmsNotificationType.STOCKOUT_CRITICAL]: stockoutCriticalSchema,
  [WmsNotificationType.ORDER_STATUS_CHANGED]: orderStatusChangedSchema,
  [WmsNotificationType.ASN_ARRIVED]: asnArrivedSchema,
  [WmsNotificationType.GRN_COMPLETED]: grnCompletedSchema,
  [WmsNotificationType.QC_FAILED]: qcFailedSchema,
  [WmsNotificationType.PUTAWAY_DELAYED]: putawayDelayedSchema,
  [WmsNotificationType.CYCLE_COUNT_VARIANCE]: cycleCountVarianceSchema,
  [WmsNotificationType.RF_SESSION_TIMEOUT]: rfSessionTimeoutSchema,
  [WmsNotificationType.SYSTEM_QUOTA_WARNING]: systemQuotaWarningSchema,
  [WmsNotificationType.DAILY_KPI_REPORT]: dailyKpiReportSchema,
  [WmsNotificationType.REPORT_READY]: reportReadySchema,
};

export const COMPLIANCE_OVERRIDE_TYPES = new Set<string>([
  WmsNotificationType.STOCKOUT_CRITICAL,
  WmsNotificationType.QC_FAILED,
  WmsNotificationType.SYSTEM_QUOTA_WARNING,
  WmsNotificationType.RF_SESSION_TIMEOUT,
]);

export const NOTIFICATION_ROLE_MAP: Record<string, string[]> = {
  [WmsNotificationType.LOW_STOCK_ALERT]: ['WAREHOUSE_SUPERVISOR', 'INVENTORY_CLERK'],
  [WmsNotificationType.STOCKOUT_CRITICAL]: ['TENANT_ADMIN', 'WAREHOUSE_ADMIN'],
  [WmsNotificationType.ORDER_STATUS_CHANGED]: ['CLIENT', 'WAREHOUSE_ADMIN', 'SALES_REP', 'INVENTORY_CLERK', 'PLANNING_MANAGER'],
  [WmsNotificationType.ASN_ARRIVED]: ['RECEIVING_SUPERVISOR'],
  [WmsNotificationType.GRN_COMPLETED]: ['INVENTORY_CLERK'],
  [WmsNotificationType.QC_FAILED]: ['QC_MANAGER', 'PURCHASING_MANAGER'],
  [WmsNotificationType.PUTAWAY_DELAYED]: ['WAREHOUSE_SUPERVISOR'],
  [WmsNotificationType.CYCLE_COUNT_VARIANCE]: ['WAREHOUSE_ADMIN'],
  [WmsNotificationType.RF_SESSION_TIMEOUT]: ['WAREHOUSE_SUPERVISOR'],
  [WmsNotificationType.SYSTEM_QUOTA_WARNING]: ['TENANT_ADMIN'],
  [WmsNotificationType.DAILY_KPI_REPORT]: ['TENANT_ADMIN', 'WAREHOUSE_ADMIN'],
  [WmsNotificationType.REPORT_READY]: ['WAREHOUSE_ADMIN'],
};

export interface NotificationDispatchEvent {
  type: string;
  tenantId: string;
  recipients: Array<{ userId?: string; roleCode?: string }>;
  variables: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'immediate';
  bypassPreferences?: boolean;
  correlationId?: string;
}

export function validateNotificationVariables(type: string, variables: Record<string, any>): void {
  const schema = NOTIFICATION_SCHEMAS[type];
  if (!schema) return;
  const result = schema.safeParse(variables);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Variable validation failed for ${type}: ${missing}`);
  }
}
