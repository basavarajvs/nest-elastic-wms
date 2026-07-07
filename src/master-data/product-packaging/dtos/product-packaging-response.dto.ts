import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductPackagingResponseDto {
  @ApiProperty() hierarchy_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() parent_uom_id: bigint;
  @ApiPropertyOptional() parent_uom_name?: string;
  @ApiProperty() child_uom_id: bigint;
  @ApiPropertyOptional() child_uom_name?: string;
  @ApiProperty() quantity_per_parent: number;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateProductPackagingDto {
  @ApiProperty() product_id: number;
  @ApiProperty() parent_uom_id: number;
  @ApiProperty() child_uom_id: number;
  @ApiProperty() quantity_per_parent: number;
}

export class UpdateProductPackagingDto {
  @ApiPropertyOptional() parent_uom_id?: number;
  @ApiPropertyOptional() child_uom_id?: number;
  @ApiPropertyOptional() quantity_per_parent?: number;
}
