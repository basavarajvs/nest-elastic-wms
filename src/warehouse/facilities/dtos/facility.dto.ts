import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacilityDto {
  @ApiProperty() facility_code: string;
  @ApiProperty() facility_name: string;
  @ApiPropertyOptional() facility_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country_code?: string;
  @ApiPropertyOptional() contact_person?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() timezone_name?: string;
  @ApiPropertyOptional() default_uom_id?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateFacilityDto {
  @ApiPropertyOptional() facility_code?: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() facility_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country_code?: string;
  @ApiPropertyOptional() contact_person?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() timezone_name?: string;
  @ApiPropertyOptional() default_uom_id?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class FacilityResponseDto {
  @ApiProperty() facility_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_code: string;
  @ApiProperty() facility_name: string;
  @ApiProperty() facility_type: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country_code?: string;
  @ApiPropertyOptional() contact_person?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() timezone_name?: string;
  @ApiPropertyOptional() default_uom_id?: bigint;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class RfFacilityResponseDto {
  @ApiProperty({ type: FacilityResponseDto, nullable: true })
  facility: FacilityResponseDto | null;
  @ApiPropertyOptional()
  message?: string;
}

export class FacilitySummaryEntryDto {
  @ApiProperty() facilityId: string;
  @ApiProperty() facilityCode: string;
  @ApiProperty() facilityName: string;
  @ApiProperty() zoneCount: number;
  @ApiProperty() locationCount: number;
}

export class FacilitySummaryDto {
  @ApiProperty() total: number;
  @ApiProperty({ type: [FacilitySummaryEntryDto] })
  facilities: FacilitySummaryEntryDto[];
}

class HierarchyLocationDto {
  @ApiProperty() location_id: bigint;
  @ApiProperty() location_code: string;
  @ApiProperty() location_name: string;
  @ApiProperty() location_type: string;
}

class HierarchyZoneDto {
  @ApiProperty() zone_id: bigint;
  @ApiProperty() zone_code: string;
  @ApiProperty() zone_name: string;
  @ApiProperty() zone_type: string;
  @ApiProperty({ type: [HierarchyLocationDto] })
  locations: HierarchyLocationDto[];
}

export class FacilityHierarchyDto {
  @ApiProperty({ type: FacilityResponseDto, nullable: true })
  facility: FacilityResponseDto | null;
  @ApiPropertyOptional({ type: [HierarchyZoneDto] })
  zones?: HierarchyZoneDto[];
  @ApiPropertyOptional({ type: [HierarchyLocationDto] })
  unassignedLocations?: HierarchyLocationDto[];
  @ApiProperty()
  summary: any;
}

// ─── Facility Access Control DTOs ─────────────────────────────────────

export class CreateFacilityAccessDto {
  @ApiProperty() facility_id: number;
  @ApiProperty() user_id: string;
  @ApiPropertyOptional() role_in_facility?: string;
  @ApiPropertyOptional() permissions_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateFacilityAccessDto {
  @ApiPropertyOptional() role_in_facility?: string;
  @ApiPropertyOptional() permissions_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class FacilityAccessResponseDto {
  @ApiProperty() access_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() user_id: string;
  @ApiPropertyOptional() role_in_facility?: string;
  @ApiPropertyOptional() permissions_json?: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint;
}

// ─── Facility User Assignment DTOs ────────────────────────────────────

export class CreateFacilityUserDto {
  @ApiProperty() facility_id: number;
  @ApiProperty() user_id: string;
  @ApiPropertyOptional() user_email?: string;
  @ApiPropertyOptional() user_name?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateFacilityUserDto {
  @ApiPropertyOptional() user_email?: string;
  @ApiPropertyOptional() user_name?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() notes?: string;
}

export class FacilityUserResponseDto {
  @ApiProperty() assignment_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() user_id: string;
  @ApiPropertyOptional() user_email?: string;
  @ApiPropertyOptional() user_name?: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty() assigned_at: Date;
  @ApiPropertyOptional() assigned_by?: string;
  @ApiPropertyOptional() unassigned_at?: Date;
  @ApiPropertyOptional() unassigned_by?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint;
}
