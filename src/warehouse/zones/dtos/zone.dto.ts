import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() zone_code: string;
  @ApiPropertyOptional() zone_name?: string;
  @ApiPropertyOptional() zone_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() configuration_json?: string;
  @ApiPropertyOptional() layout_coordinates_json?: string;
  @ApiPropertyOptional() visual_map_url?: string;
  @ApiPropertyOptional() zone_color_hex?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateZoneDto {
  @ApiPropertyOptional() zone_code?: string;
  @ApiPropertyOptional() zone_name?: string;
  @ApiPropertyOptional() zone_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() configuration_json?: string;
  @ApiPropertyOptional() layout_coordinates_json?: string;
  @ApiPropertyOptional() visual_map_url?: string;
  @ApiPropertyOptional() zone_color_hex?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class ZoneResponseDto {
  @ApiProperty() zone_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() zone_code: string;
  @ApiProperty() zone_name: string;
  @ApiProperty() zone_type: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() configuration_json?: string | null;
  @ApiPropertyOptional() layout_coordinates_json?: string | null;
  @ApiPropertyOptional() visual_map_url?: string | null;
  @ApiPropertyOptional() zone_color_hex?: string | null;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint | null;
}
