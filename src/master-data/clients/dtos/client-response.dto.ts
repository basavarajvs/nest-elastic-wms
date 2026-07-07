import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty() client_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() client_code: string;
  @ApiProperty() client_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() credit_limit?: number;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() preferred_carrier_id?: bigint;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() client_type?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class FacilityAssignmentDto {
  @ApiProperty() assignment_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() client_id: bigint;
  @ApiPropertyOptional() client_name?: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() is_active: boolean;
}

export class ClientAddressDto {
  @ApiProperty() address_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() client_id: bigint;
  @ApiProperty() address_type: string;
  @ApiProperty() address_line1: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiProperty() city: string;
  @ApiProperty() state_province: string;
  @ApiProperty() postal_code: string;
  @ApiProperty() country_code: string;
  @ApiProperty() is_default: boolean;
  @ApiProperty() is_active: boolean;
}

export class ClientContactDto {
  @ApiProperty() contact_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() client_id: bigint;
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty() is_primary: boolean;
  @ApiProperty() is_active: boolean;
}

export class CreateClientAddressDto {
  @ApiPropertyOptional() address_type?: string;
  @ApiProperty() address_line1: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiProperty() city: string;
  @ApiProperty() state_province: string;
  @ApiProperty() postal_code: string;
  @ApiPropertyOptional() country_code?: string;
  @ApiPropertyOptional() is_default?: boolean;
}

export class CreateClientContactDto {
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() is_primary?: boolean;
}

export class CreateClientDto {
  @ApiProperty() client_code: string;
  @ApiProperty() client_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() credit_limit?: number;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() preferred_carrier_id?: number;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() client_type?: string;
  @ApiPropertyOptional({ type: [CreateClientAddressDto] })
  addresses?: CreateClientAddressDto[];
  @ApiPropertyOptional({ type: [CreateClientContactDto] })
  contacts?: CreateClientContactDto[];
}

export class UpdateClientDto {
  @ApiPropertyOptional() client_code?: string;
  @ApiPropertyOptional() client_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() credit_limit?: number;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() preferred_carrier_id?: number;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() client_type?: string;
}
