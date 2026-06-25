export class QueryDailyKpiDto {
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class QueryKpiSummaryDto {
  facilityId?: string;
  startDate?: string;
  endDate?: string;
}
