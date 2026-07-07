import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto, DeleteResultDto } from '../../../common/dto/paginated-response.dto';

export { DeleteResultDto };

export class TrailerDto {
  @ApiProperty() trailer_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() trailer_number: string;
  @ApiPropertyOptional() carrier_id: number | null;
  @ApiPropertyOptional() carrier_name: string | null;
  @ApiPropertyOptional() trailer_type: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() max_weight_kg: number | null;
  @ApiPropertyOptional() max_volume_cbm: number | null;
  @ApiPropertyOptional() max_pallets: number | null;
  @ApiPropertyOptional() max_cartons: number | null;
  @ApiPropertyOptional() assigned_load_id: number | null;
  @ApiPropertyOptional() load_number: string | null;
  @ApiPropertyOptional() assigned_dock_id: number | null;
  @ApiPropertyOptional() dock_name: string | null;
  @ApiPropertyOptional() seal_number: string | null;
  @ApiPropertyOptional() arrival_time: string | null;
  @ApiPropertyOptional() departure_time: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class TrailerListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [TrailerDto] })
  data: TrailerDto[];
}

export class CheckInTrailerDto {
  @ApiProperty() trailer_number: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() carrier_id: number;
  @ApiPropertyOptional() carrier_name: string;
  @ApiPropertyOptional() seal_number: string;
  @ApiPropertyOptional() dock_id: number;
  @ApiPropertyOptional() trailer_type: string;
  @ApiPropertyOptional() max_weight_kg: number;
  @ApiPropertyOptional() max_volume_cbm: number;
  @ApiPropertyOptional() max_pallets: number;
  @ApiPropertyOptional() max_cartons: number;
  @ApiPropertyOptional() arrival_time: string;
  @ApiPropertyOptional() notes: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfTrailerCheckInDto {
  @ApiProperty() trailer_number: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfTrailerAssignDoorDto {
  @ApiProperty() trailer_id: string;
  @ApiProperty() dock_code: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfTrailerDepartDto {
  @ApiProperty() trailer_id: string;
}
