import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAisleDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() zone_id: string;
  @ApiProperty() aisle_code: string;
  @ApiPropertyOptional() aisle_name?: string;
  @ApiPropertyOptional() aisle_number?: number;
  @ApiPropertyOptional() width_meters?: number;
  @ApiPropertyOptional() length_meters?: number;
  @ApiPropertyOptional() picking_direction?: string;
  @ApiPropertyOptional() start_sequence_number?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_blocked?: boolean;
  @ApiPropertyOptional() block_reason?: string;
  @ApiPropertyOptional() allowed_equipment_types_json?: string;
  @ApiPropertyOptional() max_equipment_height_cm?: number;
}

export class CreateBayDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() zone_id: string;
  @ApiProperty() aisle_id: string;
  @ApiProperty() rack_row_id: string;
  @ApiProperty() bay_code: string;
  @ApiPropertyOptional() bay_name?: string;
  @ApiPropertyOptional() bay_number?: number;
  @ApiPropertyOptional() length_meters?: number;
  @ApiPropertyOptional() side?: string;
  @ApiPropertyOptional() position_start_meters?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_reserved?: boolean;
  @ApiPropertyOptional() reservation_notes?: string;
  @ApiPropertyOptional() positions_per_level?: number;
  @ApiPropertyOptional() status?: string;
}

export class CreateRackRowDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() aisle_id: string;
  @ApiProperty() rack_row_code: string;
  @ApiPropertyOptional() rack_row_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() total_levels?: number;
  @ApiPropertyOptional() total_bays?: number;
  @ApiPropertyOptional() total_capacity?: number;
  @ApiPropertyOptional() weight_capacity_per_level?: number;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() barcode_value?: string;
  @ApiPropertyOptional() qr_code_data?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreateLevelDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() bay_id: string;
  @ApiProperty() level_number: number;
  @ApiPropertyOptional() level_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() depth?: number;
  @ApiPropertyOptional() weight_capacity?: number;
  @ApiPropertyOptional() volume_capacity?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreateLoadingDockDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() dock_code: string;
  @ApiPropertyOptional() dock_name?: string;
  @ApiPropertyOptional() dock_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() max_trailer_length?: number;
  @ApiPropertyOptional() max_trailer_height?: number;
  @ApiPropertyOptional() has_leveler?: boolean;
  @ApiPropertyOptional() has_sealant?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_available?: boolean;
}

export class UpdateLoadingDockDto {
  @ApiPropertyOptional() dock_code?: string;
  @ApiPropertyOptional() dock_name?: string;
  @ApiPropertyOptional() dock_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() max_trailer_length?: number;
  @ApiPropertyOptional() max_trailer_height?: number;
  @ApiPropertyOptional() has_leveler?: boolean;
  @ApiPropertyOptional() has_sealant?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_available?: boolean;
}

export class AisleResponseDto {
  @ApiProperty() aisle_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() zone_id: bigint;
  @ApiPropertyOptional() zone_name: string | null;
  @ApiProperty() aisle_code: string;
  @ApiPropertyOptional() aisle_name?: string | null;
  @ApiPropertyOptional() aisle_number?: number | null;
  @ApiPropertyOptional() width_meters?: number | null;
  @ApiPropertyOptional() length_meters?: number | null;
  @ApiPropertyOptional() picking_direction?: string | null;
  @ApiPropertyOptional() start_sequence_number?: number | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() is_blocked?: boolean | null;
  @ApiPropertyOptional() block_reason?: string | null;
  @ApiPropertyOptional() allowed_equipment_types_json?: string | null;
  @ApiPropertyOptional() max_equipment_height_cm?: number | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class BayResponseDto {
  @ApiProperty() bay_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() zone_id: bigint;
  @ApiPropertyOptional() zone_name: string | null;
  @ApiProperty() aisle_id: bigint;
  @ApiPropertyOptional() aisle_name: string | null;
  @ApiProperty() rack_row_id: bigint;
  @ApiProperty() bay_code: string;
  @ApiPropertyOptional() bay_name?: string | null;
  @ApiPropertyOptional() bay_number?: number | null;
  @ApiPropertyOptional() length_meters?: number | null;
  @ApiPropertyOptional() side?: string | null;
  @ApiPropertyOptional() position_start_meters?: number | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() is_reserved?: boolean | null;
  @ApiPropertyOptional() reservation_notes?: string | null;
  @ApiPropertyOptional() positions_per_level?: number | null;
  @ApiPropertyOptional() status?: string | null;
  @ApiPropertyOptional() status_changed_at?: Date | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class RackRowResponseDto {
  @ApiProperty() rack_row_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() aisle_id: bigint;
  @ApiProperty() rack_row_code: string;
  @ApiPropertyOptional() rack_row_name?: string | null;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() length?: number | null;
  @ApiPropertyOptional() width?: number | null;
  @ApiPropertyOptional() height?: number | null;
  @ApiPropertyOptional() total_levels?: number | null;
  @ApiPropertyOptional() total_bays?: number | null;
  @ApiPropertyOptional() total_capacity?: number | null;
  @ApiPropertyOptional() weight_capacity_per_level?: number | null;
  @ApiPropertyOptional() zone_id?: bigint | null;
  @ApiPropertyOptional() barcode_value?: string | null;
  @ApiPropertyOptional() qr_code_data?: string | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class LevelResponseDto {
  @ApiProperty() level_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() bay_id: bigint;
  @ApiPropertyOptional() bay_code: string | null;
  @ApiProperty() level_number: number;
  @ApiPropertyOptional() level_name?: string | null;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() height?: number | null;
  @ApiPropertyOptional() width?: number | null;
  @ApiPropertyOptional() depth?: number | null;
  @ApiPropertyOptional() weight_capacity?: number | null;
  @ApiPropertyOptional() volume_capacity?: number | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class LoadingDockResponseDto {
  @ApiProperty() dock_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() dock_code: string;
  @ApiPropertyOptional() dock_name?: string | null;
  @ApiProperty() dock_type: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() location_id?: bigint | null;
  @ApiPropertyOptional() max_trailer_length?: number | null;
  @ApiPropertyOptional() max_trailer_height?: number | null;
  @ApiPropertyOptional() has_leveler?: boolean | null;
  @ApiPropertyOptional() has_sealant?: boolean | null;
  @ApiProperty() is_active: boolean;
  @ApiProperty() is_available: boolean;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}
