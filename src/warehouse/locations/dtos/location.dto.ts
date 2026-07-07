import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() aisle_id?: string;
  @ApiPropertyOptional() bay_id?: string;
  @ApiPropertyOptional() rack_row_id?: string;
  @ApiPropertyOptional() level_id?: string;
  @ApiProperty() location_code: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() location_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() max_weight?: number;
  @ApiPropertyOptional() max_volume?: number;
  @ApiPropertyOptional() allowed_product_categories_json?: string;
  @ApiPropertyOptional() allowed_product_attributes_json?: string;
  @ApiPropertyOptional() allowed_storage_conditions_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_blocked?: boolean;
  @ApiPropertyOptional() is_reserved?: boolean;
  @ApiPropertyOptional() location_tier?: string;
  @ApiPropertyOptional() block_reason?: string;
  @ApiPropertyOptional() reservation_details_json?: string;
  @ApiPropertyOptional() pick_sequence_number?: number;
  @ApiPropertyOptional() travel_distance_from_dock?: number;
  @ApiPropertyOptional() barcode_value?: string;
  @ApiPropertyOptional() qr_code_data?: string;
  @ApiPropertyOptional() label_printed_at?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() bay_number?: number;
}

export class UpdateLocationDto {
  @ApiPropertyOptional() location_code?: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() location_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() max_weight?: number;
  @ApiPropertyOptional() max_volume?: number;
  @ApiPropertyOptional() allowed_product_categories_json?: string;
  @ApiPropertyOptional() allowed_product_attributes_json?: string;
  @ApiPropertyOptional() allowed_storage_conditions_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_blocked?: boolean;
  @ApiPropertyOptional() is_reserved?: boolean;
  @ApiPropertyOptional() location_tier?: string;
  @ApiPropertyOptional() block_reason?: string;
  @ApiPropertyOptional() reservation_details_json?: string;
  @ApiPropertyOptional() pick_sequence_number?: number;
  @ApiPropertyOptional() travel_distance_from_dock?: number;
  @ApiPropertyOptional() barcode_value?: string;
  @ApiPropertyOptional() qr_code_data?: string;
  @ApiPropertyOptional() label_printed_at?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() bay_number?: number;
}

export class LocationResponseDto {
  @ApiProperty() location_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() location_code: string;
  @ApiProperty() location_name: string;
  @ApiProperty() location_type: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() length?: number | null;
  @ApiPropertyOptional() width?: number | null;
  @ApiPropertyOptional() height?: number | null;
  @ApiPropertyOptional() max_weight?: number | null;
  @ApiPropertyOptional() max_volume?: number | null;
  @ApiPropertyOptional() allowed_product_categories_json?: string | null;
  @ApiPropertyOptional() allowed_product_attributes_json?: string | null;
  @ApiPropertyOptional() allowed_storage_conditions_json?: string | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() is_blocked?: boolean | null;
  @ApiPropertyOptional() is_reserved?: boolean | null;
  @ApiPropertyOptional() location_tier?: string | null;
  @ApiPropertyOptional() block_reason?: string | null;
  @ApiPropertyOptional() reservation_details_json?: string | null;
  @ApiPropertyOptional() zone_id?: bigint | null;
  @ApiPropertyOptional() aisle_id?: bigint | null;
  @ApiPropertyOptional() bay_id?: bigint | null;
  @ApiPropertyOptional() rack_row_id?: bigint | null;
  @ApiPropertyOptional() level_id?: bigint | null;
  @ApiPropertyOptional() bay_number?: number | null;
  @ApiPropertyOptional() pick_sequence_number?: number | null;
  @ApiPropertyOptional() travel_distance_from_dock?: number | null;
  @ApiPropertyOptional() barcode_value?: string | null;
  @ApiPropertyOptional() qr_code_data?: string | null;
  @ApiPropertyOptional() label_printed_at?: Date | null;
  @ApiPropertyOptional() client_id?: bigint | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint | null;
}

export class RfLocationLookupRequestDto {
  @ApiProperty() barcode: string;
}

export class RfLocationLookupDto {
  @ApiProperty() locationId: string;
  @ApiProperty() locationCode: string;
  @ApiProperty() locationName: string;
  @ApiProperty() locationType: string;
}

export class LocationCapacityDto {
  @ApiProperty() locationCode: string;
  @ApiProperty() locationType: string;
  @ApiPropertyOptional() maxWeight?: number;
  @ApiPropertyOptional() maxVolume?: number;
  @ApiProperty() currentQty: number;
}
