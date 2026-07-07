import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty() customer_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() customer_code: string;
  @ApiProperty() customer_name: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country?: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
}

export class CreateCustomerDto {
  @ApiProperty() customer_code: string;
  @ApiProperty() customer_name: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional() customer_code?: string;
  @ApiPropertyOptional() customer_name?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() address_line1?: string;
  @ApiPropertyOptional() address_line2?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() state_province?: string;
  @ApiPropertyOptional() postal_code?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() is_active?: boolean;
}
