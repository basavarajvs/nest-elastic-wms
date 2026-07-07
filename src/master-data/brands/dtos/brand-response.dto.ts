import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty() brand_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() brand_name: string;
  @ApiProperty() brand_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logo_url?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateBrandDto {
  @ApiProperty() brand_name: string;
  @ApiProperty() brand_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logo_url?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateBrandDto {
  @ApiPropertyOptional() brand_name?: string;
  @ApiPropertyOptional() brand_code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logo_url?: string;
  @ApiPropertyOptional() is_active?: boolean;
}
