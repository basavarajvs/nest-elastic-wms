import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class VasServiceDto {
  @ApiProperty() vas_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() vas_code: string;
  @ApiProperty() vas_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() service_category?: string;
  @ApiPropertyOptional() charge_type?: string;
  @ApiPropertyOptional() base_charge?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() minimum_charge?: number;
  @ApiPropertyOptional() maximum_charge?: number;
  @ApiProperty() requires_approval: boolean;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class VasServicePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [VasServiceDto] })
  data: VasServiceDto[];
}

export class VasWorkstationDto {
  @ApiProperty() workstation_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() workstation_code: string;
  @ApiProperty() workstation_name: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() aisle?: string;
  @ApiPropertyOptional() floor_level?: number;
  @ApiPropertyOptional() station_type?: string;
  @ApiPropertyOptional() supported_services?: any;
  @ApiPropertyOptional() equipment_json?: any;
  @ApiProperty() status: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() max_concurrent_tasks?: number;
  @ApiPropertyOptional() current_active_tasks?: number;
  @ApiPropertyOptional() operational_hours_json?: any;
  @ApiPropertyOptional() assigned_user_id?: string;
  @ApiPropertyOptional() last_used_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class VasWorkstationPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [VasWorkstationDto] })
  data: VasWorkstationDto[];
}

export class VasClientRateDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() service_code: string;
  @ApiProperty() client_id: string;
  @ApiPropertyOptional() client_specific_rate?: number;
  @ApiPropertyOptional() currency?: string;
}

export class RateLookupResultDto {
  @ApiPropertyOptional() rate?: number;
  @ApiProperty() source: string;
}

export class CreateVasServiceDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() vas_code: string;
  @ApiProperty() vas_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() service_category?: string;
  @ApiPropertyOptional() charge_type?: string;
  @ApiPropertyOptional() base_charge?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() minimum_charge?: number;
  @ApiPropertyOptional() maximum_charge?: number;
  @ApiPropertyOptional() requires_approval?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateVasServiceDto {
  @ApiPropertyOptional() vas_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() service_category?: string;
  @ApiPropertyOptional() charge_type?: string;
  @ApiPropertyOptional() base_charge?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() minimum_charge?: number;
  @ApiPropertyOptional() maximum_charge?: number;
  @ApiPropertyOptional() requires_approval?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreateVasClientRateDto {
  @ApiProperty() service_code: string;
  @ApiProperty() client_id: string;
  @ApiPropertyOptional() client_specific_rate?: number;
  @ApiPropertyOptional() currency?: string;
}

export class CreateVasWorkstationDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() workstation_code: string;
  @ApiProperty() workstation_name: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() aisle?: string;
  @ApiPropertyOptional() floor_level?: number;
  @ApiPropertyOptional() station_type?: string;
  @ApiPropertyOptional() supported_services?: any;
  @ApiPropertyOptional() equipment_json?: any;
  @ApiPropertyOptional() max_concurrent_tasks?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateVasWorkstationDto {
  @ApiPropertyOptional() workstation_name?: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() aisle?: string;
  @ApiPropertyOptional() floor_level?: number;
  @ApiPropertyOptional() station_type?: string;
  @ApiPropertyOptional() supported_services?: any;
  @ApiPropertyOptional() equipment_json?: any;
  @ApiPropertyOptional() max_concurrent_tasks?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfFindAllWorkstationsDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfFindAllWorkstationsResponseDto {
  @ApiPropertyOptional({ type: [Object] }) workstations?: any[];
}

export class RfCheckInWorkstationResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfCheckOutWorkstationResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}
