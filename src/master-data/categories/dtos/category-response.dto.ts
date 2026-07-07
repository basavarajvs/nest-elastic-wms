import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty() category_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiPropertyOptional() parent_category_id?: bigint;
  @ApiPropertyOptional() parent_category_name?: string;
  @ApiProperty() category_name: string;
  @ApiProperty() category_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateCategoryDto {
  @ApiProperty() category_name: string;
  @ApiProperty() category_code: string;
  @ApiPropertyOptional() parent_category_id?: number;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() category_name?: string;
  @ApiPropertyOptional() category_code?: string;
  @ApiPropertyOptional() parent_category_id?: number;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
}
