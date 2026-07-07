import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantResponseDto {
  @ApiProperty() variant_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() variant_code?: string;
  @ApiPropertyOptional() variant_name?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateProductVariantDto {
  @ApiProperty() product_id: number;
  @ApiProperty() variant_code: string;
  @ApiProperty() variant_name: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateProductVariantDto {
  @ApiPropertyOptional() variant_code?: string;
  @ApiPropertyOptional() variant_name?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() is_active?: boolean;
}
