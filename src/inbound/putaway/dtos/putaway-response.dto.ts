import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class PutawayTaskDto {
  @ApiProperty() task_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() task_number: string;
  @ApiPropertyOptional() task_name: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() receipt_line_id: number | null;
  @ApiPropertyOptional() receipt_item_id: number | null;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() lot_id: number | null;
  @ApiProperty() quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() uom_name: string | null;
  @ApiProperty() from_location_id: number;
  @ApiPropertyOptional() from_location_name: string | null;
  @ApiPropertyOptional() to_location_id: number | null;
  @ApiPropertyOptional() to_location_name: string | null;
  @ApiPropertyOptional() required_equipment_type: string | null;
  @ApiPropertyOptional() assigned_to_user_id: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() priority: number | null;
  @ApiPropertyOptional() created_date: string | null;
  @ApiPropertyOptional() due_date: string | null;
  @ApiPropertyOptional() completed_at: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
  @ApiPropertyOptional() grn_number: string | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiPropertyOptional() lpn_barcode: string | null;
  @ApiPropertyOptional() suggested_location_barcode: string | null;
  @ApiPropertyOptional() actual_location_barcode: string | null;
  @ApiPropertyOptional() override_reason_code: string | null;
}

export class PutawayTaskListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PutawayTaskDto] })
  data: PutawayTaskDto[];
}

export class PutawayRuleDto {
  @ApiProperty() rule_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() rule_name: string;
  @ApiProperty() rule_code: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() priority: number;
  @ApiPropertyOptional() product_category_ids_json: string | null;
  @ApiPropertyOptional() product_attribute_rules_json: string | null;
  @ApiPropertyOptional() product_uom_ids_json: string | null;
  @ApiPropertyOptional() storage_condition_requirements_json: string | null;
  @ApiPropertyOptional() destination_zone_ids_json: string | null;
  @ApiPropertyOptional() destination_location_types_json: string | null;
  @ApiPropertyOptional() destination_location_attributes_json: string | null;
  @ApiProperty() action_type: string;
  @ApiPropertyOptional() fixed_location_code: string | null;
  @ApiPropertyOptional() rotation_logic: string | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
  @ApiProperty() velocity_class_filter: string[];
  @ApiPropertyOptional() min_pick_frequency_per_day: number | null;
  @ApiPropertyOptional() prefer_pick_face_for_fast_movers: boolean | null;
  @ApiPropertyOptional() client_id: number | null;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() product_id: number | null;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() product_category_id: number | null;
  @ApiPropertyOptional() category_name: string | null;
  @ApiPropertyOptional() destination_zone_id: number | null;
  @ApiPropertyOptional() zone_name: string | null;
  @ApiPropertyOptional() location_type_preference: string | null;
  @ApiPropertyOptional() is_overflow_rule: boolean | null;
  @ApiPropertyOptional() parent_rule_id: number | null;
}

export class PutawayRuleListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PutawayRuleDto] })
  data: PutawayRuleDto[];
}

export class CreateLocationExceptionDto {
  @ApiProperty() location_id: number;
  @ApiPropertyOptional() reason_code: string;
  @ApiPropertyOptional() notes: string;
}

export class LocationExceptionDto {
  @ApiProperty() exception_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() location_id: number;
  @ApiPropertyOptional() location_name: string | null;
  @ApiProperty() exception_type: string;
  @ApiPropertyOptional() reported_by: string | null;
  @ApiPropertyOptional() reported_at: string | null;
  @ApiPropertyOptional() resolved_at: string | null;
  @ApiPropertyOptional() notes: string | null;
}

export class LocationExceptionListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [LocationExceptionDto] })
  data: LocationExceptionDto[];
}

export class PutawayDamageRecordDto {
  @ApiProperty() damage_record_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiPropertyOptional() task_id: number | null;
  @ApiPropertyOptional() damage_code_id: number | null;
  @ApiPropertyOptional() damage_code_name: string | null;
  @ApiProperty() damage_quantity: number;
  @ApiPropertyOptional() lpn_barcode: string | null;
  @ApiPropertyOptional() product_id: number | null;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() reported_by: string | null;
  @ApiPropertyOptional() reported_at: string | null;
}

export class PutawaySuggestResultDto {
  @ApiProperty() locationId: string;
  @ApiProperty() locationCode: string;
  @ApiProperty() locationType: string;
  @ApiProperty() checkDigit: string;
  @ApiPropertyOptional() zoneId: string | null;
  @ApiProperty() ruleCode: string;
  @ApiProperty() ruleName: string;
  @ApiProperty() locationTier: string;
  @ApiPropertyOptional() velocityClass: string | null;
}

export class RfStartTaskResultDto {
  @ApiProperty() updated: number;
  @ApiProperty() status: string;
}

export class RfAssignTaskResultDto {
  @ApiProperty() updated: number;
  @ApiProperty() status: string;
}

export class RfValidateLocationResultDto {
  @ApiProperty() valid: boolean;
  @ApiProperty() isExactMatch: boolean;
  @ApiProperty() locationId: string;
  @ApiProperty() locationCode: string;
  @ApiPropertyOptional() barcodeValue: string | null;
  @ApiPropertyOptional() expectedCode: string | null;
  @ApiProperty() taskId: string;
}

export class PutawayCompleteResultDto {
  @ApiProperty() durationSeconds: number;
  @ApiProperty() damageQty: number;
}

export class CreatePutawayTaskDto {
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() task_number: string;
  @ApiPropertyOptional() task_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() receipt_line_id: number;
  @ApiPropertyOptional() receipt_item_id: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() lot_id: number;
  @ApiProperty() uom_id: number;
  @ApiProperty() quantity: number;
  @ApiProperty() from_location_id: number;
  @ApiPropertyOptional() to_location_id: number;
  @ApiPropertyOptional() priority: number;
  @ApiPropertyOptional() due_date: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() lot_number: string;
  @ApiPropertyOptional() suggested_location_barcode: string;
  @ApiPropertyOptional() grn_number: string;
  @ApiPropertyOptional() lpn_barcode: string;
}

export class CompletePutawayTaskDto {
  @ApiPropertyOptional() to_location_id: number;
  @ApiPropertyOptional() actual_location_barcode: string;
  @ApiPropertyOptional() override_reason_code: string;
  @ApiPropertyOptional() damage_code_id: number;
  @ApiPropertyOptional() damage_quantity: number;
  @ApiPropertyOptional() damage_notes: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() reported_by: string;
}

export class SuggestLocationDto {
  @ApiProperty() facility_id: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() category_id: number;
}

export class CreatePutawayRuleDto {
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() client_id: number;
  @ApiPropertyOptional() product_id: number;
  @ApiPropertyOptional() product_category_id: number;
  @ApiPropertyOptional() destination_zone_id: number;
  @ApiPropertyOptional() priority: number;
  @ApiProperty() rule_name: string;
  @ApiProperty() rule_code: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() product_category_ids_json: string;
  @ApiPropertyOptional() product_attribute_rules_json: string;
  @ApiPropertyOptional() product_uom_ids_json: string;
  @ApiPropertyOptional() storage_condition_requirements_json: string;
  @ApiPropertyOptional() destination_zone_ids_json: string;
  @ApiPropertyOptional() destination_location_types_json: string;
  @ApiPropertyOptional() destination_location_attributes_json: string;
  @ApiPropertyOptional() action_type: string;
  @ApiPropertyOptional() fixed_location_code: string;
  @ApiPropertyOptional() rotation_logic: string;
  @ApiPropertyOptional() location_type_preference: string;
  @ApiPropertyOptional() velocity_class_filter: string[];
  @ApiPropertyOptional() min_pick_frequency_per_day: number;
  @ApiPropertyOptional() prefer_pick_face_for_fast_movers: boolean;
  @ApiPropertyOptional() is_active: boolean;
  @ApiPropertyOptional() is_overflow_rule: boolean;
  @ApiPropertyOptional() parent_rule_id: number;
}

export class UpdatePutawayRuleDto {
  @ApiPropertyOptional() rule_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() priority: number;
  @ApiPropertyOptional() is_active: boolean;
  @ApiPropertyOptional() action_type: string;
  @ApiPropertyOptional() rotation_logic: string;
  @ApiPropertyOptional() fixed_location_code: string;
  @ApiPropertyOptional() velocity_class_filter: string[];
  @ApiPropertyOptional() min_pick_frequency_per_day: number;
  @ApiPropertyOptional() prefer_pick_face_for_fast_movers: boolean;
  @ApiPropertyOptional() location_type_preference: string;
  @ApiPropertyOptional() product_category_ids_json: string;
  @ApiPropertyOptional() product_attribute_rules_json: string;
  @ApiPropertyOptional() product_uom_ids_json: string;
  @ApiPropertyOptional() storage_condition_requirements_json: string;
  @ApiPropertyOptional() destination_zone_ids_json: string;
  @ApiPropertyOptional() destination_location_types_json: string;
  @ApiPropertyOptional() destination_location_attributes_json: string;
  @ApiPropertyOptional() is_overflow_rule: boolean;
  @ApiPropertyOptional() parent_rule_id: number;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfScanLpnDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfAssignDto {
  @ApiProperty() task_id: string;
  @ApiProperty() user_id: string;
}

export class RfScanLocationDto {
  @ApiProperty() task_id: string;
  @ApiProperty() location_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfSuggestLocationDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() category_id?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() has_expiry?: boolean;
}

export class RfConfirmDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() actual_location_barcode?: string;
  @ApiPropertyOptional() override_reason_code?: string;
  @ApiPropertyOptional() damage_code_id?: string;
  @ApiPropertyOptional() damage_quantity?: number;
  @ApiPropertyOptional() damage_notes?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfLocationFullDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfReportDamageDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() damage_code_id?: string;
  @ApiPropertyOptional() damage_quantity?: number;
  @ApiPropertyOptional() damage_notes?: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() lpn_barcode?: string;
  @ApiPropertyOptional() notes?: string;
}
