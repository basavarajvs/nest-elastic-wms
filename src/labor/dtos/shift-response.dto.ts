import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() shift_name: string;
  @ApiProperty() shift_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() start_time: string;
  @ApiProperty() end_time: string;
  @ApiPropertyOptional() break_duration_minutes?: number;
  @ApiPropertyOptional() scheduled_days_json?: any;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateShiftDto {
  @ApiPropertyOptional() shift_name?: string;
  @ApiPropertyOptional() shift_code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() start_time?: string;
  @ApiPropertyOptional() end_time?: string;
  @ApiPropertyOptional() break_duration_minutes?: number;
  @ApiPropertyOptional() scheduled_days_json?: any;
  @ApiPropertyOptional() is_active?: boolean;
}

export class ShiftResponseDto {
  @ApiProperty() shift_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() facility_name: string;
  @ApiProperty() shift_name: string;
  @ApiProperty() shift_code: string;
  @ApiProperty() description?: string;
  @ApiProperty() start_time: Date;
  @ApiProperty() end_time: Date;
  @ApiProperty() break_duration_minutes?: number;
  @ApiProperty() scheduled_days_json?: string;
  @ApiProperty() is_active?: boolean;
  @ApiProperty() created_by?: string;
  @ApiProperty() updated_by?: string;
  @ApiProperty() created_at?: Date;
  @ApiProperty() updated_at?: Date;
}

// ─── Shift Assignment DTOs ────────────────────────────────────────────

export class CreateShiftAssignmentDto {
  @ApiProperty() facility_id: number;
  @ApiProperty() shift_id: number;
  @ApiProperty() user_id: string;
  @ApiProperty() assignment_date: string;
  @ApiPropertyOptional() scheduled_start_time?: string;
  @ApiPropertyOptional() scheduled_end_time?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateShiftAssignmentDto {
  @ApiPropertyOptional() scheduled_start_time?: string;
  @ApiPropertyOptional() scheduled_end_time?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() notes?: string;
}

export class ShiftAssignmentResponseDto {
  @ApiProperty() assignment_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() shift_id: bigint;
  @ApiProperty() user_id: string;
  @ApiProperty() assignment_date: Date;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() scheduled_end_time?: Date;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}
