export class QueryPickHeatmapDto {
  facilityId?: string;
  zoneId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class QueryTopLocationsDto {
  facilityId?: string;
  zoneId?: string;
  startDate?: string;
  endDate?: string;
  topN?: number;
}
