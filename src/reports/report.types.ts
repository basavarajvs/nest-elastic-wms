export const REPORT_QUEUE = 'wms-reports';
export const REPORT_DLQ = 'wms-reports-dlq';
export const REPORT_LOCK_PREFIX = 'report:lock:';
export const REPORT_CACHE_PREFIX = 'report:cache:';
export const REPORT_METRICS_PREFIX = 'wms:metrics:reports:';

export enum ReportType {
  STOCK_ON_HAND = 'STOCK_ON_HAND',
  MOVEMENT_HISTORY = 'MOVEMENT_HISTORY',
  VELOCITY_ABC = 'VELOCITY_ABC',
  AGING_ANALYSIS = 'AGING_ANALYSIS',
  DAILY_KPI = 'DAILY_KPI',
  LOCATION_UTILIZATION = 'LOCATION_UTILIZATION',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
  facilityId?: string;
  zoneId?: string;
  productClass?: string;
  format?: 'xlsx' | 'csv';
  liveQuery?: boolean;
  timezone?: string;
  thresholdDays?: number;
}

export interface ReportRequest {
  reportType: ReportType;
  parameters: ReportParams;
}

export interface ReportRow {
  [key: string]: any;
}

export const CACHE_TTL: Record<string, number> = {
  [ReportType.STOCK_ON_HAND]: 300,
  [ReportType.MOVEMENT_HISTORY]: 300,
  [ReportType.VELOCITY_ABC]: 1800,
  [ReportType.AGING_ANALYSIS]: 1800,
  [ReportType.DAILY_KPI]: 600,
  [ReportType.LOCATION_UTILIZATION]: 600,
};

export const RF_EVENT_TYPES = new Set<string>([]);
