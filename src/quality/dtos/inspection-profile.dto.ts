import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InspectionProfileDto {
  @ApiProperty() profile_id: bigint;
  @ApiProperty() profile_name: string;
  @ApiProperty() description?: string;
  @ApiProperty() is_active: boolean;
}

export class InspectionChecklistItemDto {
  @ApiProperty() item_id: bigint;
  @ApiProperty() profile_id: bigint;
  @ApiProperty() check_type: string;
  @ApiProperty() check_label: string;
  @ApiProperty() is_mandatory: boolean;
  @ApiProperty() sort_order?: number;
}

export class CreateInspectionProfileDto {
  @ApiProperty() profile_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() checklist_items?: CreateChecklistItemDto[];
}

export class CreateChecklistItemDto {
  @ApiProperty() check_type: string;
  @ApiProperty() check_label: string;
  @ApiPropertyOptional() is_mandatory?: boolean;
  @ApiPropertyOptional() sort_order?: number;
  @ApiPropertyOptional() acceptable_criteria?: string;
}

export class UpdateInspectionProfileDto {
  @ApiPropertyOptional() profile_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() checklist_items?: CreateChecklistItemDto[];
}

export class AssignProductToProfileDto {
  @ApiProperty() profile_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() vendor_id?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() min_expiry_days?: number;
  @ApiPropertyOptional() temperature_min?: number;
  @ApiPropertyOptional() temperature_max?: number;
  @ApiPropertyOptional() sampling_percentage?: number;
  @ApiPropertyOptional() sampling_method?: string;
}

export class ProductInspectionProfileDto {
  @ApiProperty() mapping_id: bigint;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() profile_id: bigint;
  @ApiProperty() min_expiry_days?: number;
  @ApiProperty() sampling_method?: string;
}
