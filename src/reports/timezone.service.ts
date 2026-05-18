import { Injectable } from '@nestjs/common';

@Injectable()
export class TimezoneService {
  private readonly validTimezones: Set<string>;

  constructor() {
    this.validTimezones = new Set(Intl.supportedValuesOf('timeZone'));
  }

  validateTimezone(tz: string): boolean {
    return this.validTimezones.has(tz);
  }

  convertToUtcClause(column: string, timezone: string): string {
    return `${column} AT TIME ZONE '${timezone}' AT TIME ZONE 'UTC'`;
  }

  applyDateRangeFilter(
    column: string,
    dateFrom?: string,
    dateTo?: string,
    timezone?: string,
  ): { clause: string; params: any[] } {
    const tz = timezone || 'UTC';

    if (!dateFrom && !dateTo) {
      return { clause: '', params: [] };
    }

    if (dateFrom && dateTo) {
      return {
        clause: `${this.convertToUtcClause(column, tz)} BETWEEN $1 AND $2`,
        params: [dateFrom, dateTo],
      };
    }

    if (dateFrom) {
      return {
        clause: `${this.convertToUtcClause(column, tz)} >= $1`,
        params: [dateFrom],
      };
    }

    return {
      clause: `${this.convertToUtcClause(column, tz)} <= $1`,
      params: [dateTo],
    };
  }

  async getDefaultTimezone(tenantId: string): Promise<string> {
    return 'UTC';
  }
}
