import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty() vendor_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() vendor_code: string;
  @ApiProperty() vendor_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() tax_id_number?: string;
  @ApiPropertyOptional() performance_score?: number;
  @ApiPropertyOptional() preferred_status?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateVendorAddressDto {
  @ApiPropertyOptional() address_type?: string;
  @ApiProperty() address_line1: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiProperty() city: string;
  @ApiProperty() state_province: string;
  @ApiProperty() postal_code: string;
  @ApiPropertyOptional() country_code?: string;
  @ApiPropertyOptional() is_default?: boolean;
}

export class CreateVendorContactDto {
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() is_primary?: boolean;
}

export class CreateVendorDto {
  @ApiProperty() vendor_code: string;
  @ApiProperty() vendor_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() tax_id_number?: string;
  @ApiPropertyOptional() performance_score?: number;
  @ApiPropertyOptional() preferred_status?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional({ type: [CreateVendorContactDto] })
  contacts?: CreateVendorContactDto[];
  @ApiPropertyOptional({ type: [CreateVendorAddressDto] })
  addresses?: CreateVendorAddressDto[];
}

export class UpdateVendorDto {
  @ApiPropertyOptional() vendor_code?: string;
  @ApiPropertyOptional() vendor_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() primary_contact_name?: string;
  @ApiPropertyOptional() primary_contact_email?: string;
  @ApiPropertyOptional() primary_contact_phone?: string;
  @ApiPropertyOptional() payment_terms?: string;
  @ApiPropertyOptional() tax_id_number?: string;
  @ApiPropertyOptional() performance_score?: number;
  @ApiPropertyOptional() preferred_status?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}
