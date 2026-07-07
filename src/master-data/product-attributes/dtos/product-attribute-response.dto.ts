import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductAttributeResponseDto {
  @ApiProperty() attribute_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() attribute_name: string;
  @ApiProperty() attribute_code: string;
  @ApiProperty() attribute_type: string;
  @ApiPropertyOptional() allowed_values?: string;
  @ApiPropertyOptional() is_required?: boolean;
  @ApiPropertyOptional() is_searchable?: boolean;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateProductAttributeDto {
  @ApiProperty() attribute_name: string;
  @ApiProperty() attribute_code: string;
  @ApiProperty() attribute_type: string;
  @ApiPropertyOptional() allowed_values?: string;
  @ApiPropertyOptional() is_required?: boolean;
  @ApiPropertyOptional() is_searchable?: boolean;
  @ApiPropertyOptional() description?: string;
}

export class UpdateProductAttributeDto {
  @ApiPropertyOptional() attribute_name?: string;
  @ApiPropertyOptional() attribute_code?: string;
  @ApiPropertyOptional() attribute_type?: string;
  @ApiPropertyOptional() allowed_values?: string;
  @ApiPropertyOptional() is_required?: boolean;
  @ApiPropertyOptional() is_searchable?: boolean;
  @ApiPropertyOptional() description?: string;
}
