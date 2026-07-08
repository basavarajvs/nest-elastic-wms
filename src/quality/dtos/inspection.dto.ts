import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class QualityInspectionDto {
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() inspection_number: string;
  @ApiPropertyOptional() inspection_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: bigint;
  @ApiPropertyOptional() product_id?: bigint;
  @ApiPropertyOptional() lot_id?: bigint;
  @ApiProperty() inspection_type: string;
  @ApiProperty() inspection_scope: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() result?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() lpn_code?: string;
  @ApiPropertyOptional() findings_summary?: string;
  @ApiPropertyOptional() total_items_inspected?: number;
  @ApiPropertyOptional() total_passed_items?: number;
  @ApiPropertyOptional() total_failed_items?: number;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
}

export class InspectionResultDto {
  @ApiProperty() result_id: bigint;
  @ApiProperty() inspection_id: bigint;
  @ApiPropertyOptional() product_id?: bigint;
  @ApiProperty() result_status: string;
  @ApiPropertyOptional() failure_reason?: string;
  @ApiPropertyOptional() inspection_criteria_results_json?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() created_at?: Date;
}

export class InspectionPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [QualityInspectionDto] })
  data: QualityInspectionDto[];
}

export class SupervisorApproveDto {
  @ApiPropertyOptional() override_disposition?: string;
}

export class SupervisorApproveResultDto {
  @ApiProperty() approved: boolean;
  @ApiProperty() inspectionId: string;
}

export class SupervisorRejectDto {
  @ApiPropertyOptional() reason?: string;
}

export class SupervisorRejectResultDto {
  @ApiProperty() rejected: boolean;
  @ApiProperty() originalInspectionId: string;
  @ApiProperty() newInspectionId: string;
}

export class SeedResultDto {
  @ApiProperty() seeded: number;
}

export class RecordResultResponseDto {
  @ApiProperty() result_id: bigint;
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() result_status: string;
  @ApiPropertyOptional() failure_reason?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() requiresSupervisorReview: boolean;
  @ApiProperty() overallResult: string;
  @ApiProperty() created_at?: Date;
}

export class LotValidationDto {
  @ApiProperty() match: boolean;
  @ApiProperty({ nullable: true })
  expectedLot: string | null;
  @ApiProperty() actualLotNumber: string;
}

export class ExpiryValidationDto {
  @ApiProperty() valid: boolean;
  @ApiProperty() reason: string;
  @ApiPropertyOptional() daysRemaining?: number;
  @ApiPropertyOptional() minExpiryDays?: number;
}

export class TemperatureRecordingDto {
  @ApiProperty() recorded: boolean;
  @ApiProperty() readingCelsius: number;
  @ApiProperty() isCompliant: boolean;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfLpnLookupQcDto {
  @ApiProperty() barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfMyInspectionTasksDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfGetNextQcTaskDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfValidateLotDto {
  @ApiProperty() inspection_id: string;
  @ApiProperty() actual_lot_number: string;
}

export class RfValidateExpiryDto {
  @ApiProperty() product_id: string;
  @ApiProperty() expiry_date: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfValidateTemperatureDto {
  @ApiProperty() temperature_celsius: number;
  @ApiPropertyOptional() is_compliant?: boolean;
}

export class RfPendingReviewDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfSupervisorApproveDto {
  @ApiPropertyOptional() supervisor_id?: string;
  @ApiPropertyOptional() override_disposition?: string;
}

export class RfSupervisorRejectDto {
  @ApiPropertyOptional() supervisor_id?: string;
}

export class RfRecordResultRequestDto {
  @ApiPropertyOptional() result_status?: string;
  @ApiPropertyOptional() failure_reason?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() defect_code_id?: number;
  @ApiPropertyOptional() quantity_affected?: number;
}

// ─── Inspection Defect DTOs ───────────────────────────────────────────

export class CreateInspectionDefectDto {
  @ApiProperty() inspection_id: number;
  @ApiProperty() defect_code_id: number;
  @ApiPropertyOptional() quantity_affected?: number;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateInspectionDefectDto {
  @ApiPropertyOptional() defect_code_id?: number;
  @ApiPropertyOptional() quantity_affected?: number;
  @ApiPropertyOptional() notes?: string;
}

export class InspectionDefectResponseDto {
  @ApiProperty() defect_id: bigint;
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() defect_code_id: bigint;
  @ApiPropertyOptional() defect_code_name?: string;
  @ApiPropertyOptional() defect_code_category?: string;
  @ApiPropertyOptional() defect_code_severity?: string;
  @ApiPropertyOptional() quantity_affected?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() recorded_by?: string;
  @ApiPropertyOptional() recorded_at?: Date;
}

// ─── Temperature Log DTOs ─────────────────────────────────────────────

export class CreateTemperatureLogDto {
  @ApiProperty() inspection_id: number;
  @ApiProperty() reading_celsius: number;
  @ApiPropertyOptional() acceptable_min?: number;
  @ApiPropertyOptional() acceptable_max?: number;
  @ApiPropertyOptional() is_compliant?: boolean;
  @ApiPropertyOptional() device_id?: string;
}

export class UpdateTemperatureLogDto {
  @ApiPropertyOptional() reading_celsius?: number;
  @ApiPropertyOptional() acceptable_min?: number;
  @ApiPropertyOptional() acceptable_max?: number;
  @ApiPropertyOptional() is_compliant?: boolean;
  @ApiPropertyOptional() device_id?: string;
}

export class TemperatureLogResponseDto {
  @ApiProperty() log_id: bigint;
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() reading_celsius: number;
  @ApiPropertyOptional() acceptable_min?: number;
  @ApiPropertyOptional() acceptable_max?: number;
  @ApiProperty() is_compliant: boolean;
  @ApiPropertyOptional() device_id?: string;
  @ApiPropertyOptional() logged_at?: Date;
  @ApiPropertyOptional() logged_by?: string;
}
