import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CarrierResponseDto {
  @ApiProperty() carrier_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() carrier_code: string;
  @ApiProperty() carrier_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() contact_name?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() api_endpoint_url?: string;
  @ApiPropertyOptional() api_key?: string;
  @ApiPropertyOptional() api_username?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateCarrierDto {
  @ApiProperty() carrier_code: string;
  @ApiProperty() carrier_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() contact_name?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() api_endpoint_url?: string;
  @ApiPropertyOptional() api_key?: string;
  @ApiPropertyOptional() api_username?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateCarrierDto {
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() contact_name?: string;
  @ApiPropertyOptional() contact_email?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() api_endpoint_url?: string;
  @ApiPropertyOptional() api_key?: string;
  @ApiPropertyOptional() api_username?: string;
  @ApiPropertyOptional() is_active?: boolean;
}
