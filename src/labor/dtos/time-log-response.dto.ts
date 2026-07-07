import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeLogResponseDto {
  @ApiProperty() time_log_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() facility_name: string;
  @ApiProperty() assignment_id?: bigint;
  @ApiProperty() user_id: string;
  @ApiProperty() date_worked: Date;
  @ApiProperty() clock_in_time: Date;
  @ApiProperty() clock_out_time?: Date;
  @ApiProperty() total_worked_minutes?: number;
  @ApiProperty() total_break_minutes?: number;
  @ApiProperty() net_worked_minutes?: number;
  @ApiProperty() status: string;
  @ApiProperty() notes?: string;
  @ApiProperty() created_at?: Date;
  @ApiProperty() updated_at?: Date;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class ClockInDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional() notes?: string;
}

export class MyMetricsDto {
  @ApiPropertyOptional() start_date?: string;
  @ApiPropertyOptional() end_date?: string;
  @ApiPropertyOptional() facility_id?: string;
}
