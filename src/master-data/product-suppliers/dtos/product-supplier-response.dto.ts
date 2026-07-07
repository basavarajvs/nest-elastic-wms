import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSupplierResponseDto {
  @ApiProperty() product_supplier_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() vendor_id: bigint;
  @ApiPropertyOptional() vendor_name?: string;
  @ApiPropertyOptional() supplier_part_number?: string;
  @ApiProperty() lead_time_days?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() minimum_order_quantity?: number;
  @ApiPropertyOptional() maximum_order_quantity?: number;
  @ApiPropertyOptional() preferred_supplier?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateProductSupplierDto {
  @ApiProperty() product_id: number;
  @ApiProperty() vendor_id: number;
  @ApiPropertyOptional() supplier_part_number?: string;
  @ApiPropertyOptional() lead_time_days?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() minimum_order_quantity?: number;
  @ApiPropertyOptional() maximum_order_quantity?: number;
  @ApiPropertyOptional() preferred_supplier?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateProductSupplierDto {
  @ApiPropertyOptional() supplier_part_number?: string;
  @ApiPropertyOptional() lead_time_days?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() minimum_order_quantity?: number;
  @ApiPropertyOptional() maximum_order_quantity?: number;
  @ApiPropertyOptional() preferred_supplier?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}
