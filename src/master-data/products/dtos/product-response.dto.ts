import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty() product_id: bigint;
  @ApiProperty() product_code: string;
  @ApiProperty() product_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() short_description?: string;

  // flattened foreign keys — ID + name always paired
  @ApiProperty() category_id: bigint;
  @ApiProperty() category_name: string;
  @ApiPropertyOptional() brand_id?: bigint;
  @ApiPropertyOptional() brand_name?: string;
  @ApiProperty() primary_uom_id: bigint;
  @ApiProperty() uom_name: string;

  @ApiPropertyOptional() base_price?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() storage_temperature_min?: number;
  @ApiPropertyOptional() storage_temperature_max?: number;
  @ApiProperty() requires_temperature_control: boolean;
  @ApiProperty() requires_light_control: boolean;
  @ApiProperty() requires_humidity_control: boolean;
  @ApiProperty() is_hazardous: boolean;
  @ApiPropertyOptional() hazmat_class?: string;
  @ApiPropertyOptional() hazmat_description?: string;
  @ApiProperty() is_perishable: boolean;
  @ApiPropertyOptional() shelf_life_days?: number;
  @ApiProperty() track_serial_numbers: boolean;
  @ApiProperty() track_lot_numbers: boolean;
  @ApiPropertyOptional() abc_analysis_class?: string;
  @ApiPropertyOptional() default_cycle_count_frequency_days?: number;
  @ApiPropertyOptional() last_counted_at?: Date;
  @ApiPropertyOptional() next_count_due_at?: Date;
  @ApiProperty() is_sensitive: boolean;
  @ApiPropertyOptional() sensitivity_level?: string;
  @ApiPropertyOptional() eaches_per_case?: number;
  @ApiPropertyOptional() cases_per_pallet?: number;
  @ApiPropertyOptional() preferred_pick_uom?: string;
  @ApiProperty() is_active?: boolean;
  @ApiPropertyOptional() track_expiry?: boolean;
  @ApiPropertyOptional() primary_image_url?: string;
  @ApiPropertyOptional() thumbnail_image_url?: string;
  @ApiPropertyOptional({ type: [String] })
  image_gallery_urls?: string[];
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;

  // flattened relation names (legacy compat removed)
  @ApiPropertyOptional() barcodes?: any;
  @ApiPropertyOptional() suppliers?: any;
  @ApiPropertyOptional() packaging?: any;
  @ApiPropertyOptional() variants?: any;
}

export class CreateProductDto {
  @ApiProperty() product_code: string;
  @ApiProperty() product_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() short_description?: string;
  @ApiProperty() category_id: number;
  @ApiPropertyOptional() brand_id?: number;
  @ApiProperty() primary_uom_id: number;
  @ApiPropertyOptional() base_price?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() storage_temperature_min?: number;
  @ApiPropertyOptional() storage_temperature_max?: number;
  @ApiPropertyOptional() requires_temperature_control?: boolean;
  @ApiPropertyOptional() requires_light_control?: boolean;
  @ApiPropertyOptional() requires_humidity_control?: boolean;
  @ApiPropertyOptional() is_hazardous?: boolean;
  @ApiPropertyOptional() hazmat_class?: string;
  @ApiPropertyOptional() hazmat_description?: string;
  @ApiPropertyOptional() is_perishable?: boolean;
  @ApiPropertyOptional() shelf_life_days?: number;
  @ApiPropertyOptional() track_serial_numbers?: boolean;
  @ApiPropertyOptional() track_lot_numbers?: boolean;
  @ApiPropertyOptional() abc_analysis_class?: string;
  @ApiPropertyOptional() default_cycle_count_frequency_days?: number;
  @ApiPropertyOptional() last_counted_at?: string;
  @ApiPropertyOptional() next_count_due_at?: string;
  @ApiPropertyOptional() is_sensitive?: boolean;
  @ApiPropertyOptional() sensitivity_level?: string;
  @ApiPropertyOptional() eaches_per_case?: number;
  @ApiPropertyOptional() cases_per_pallet?: number;
  @ApiPropertyOptional() preferred_pick_uom?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() track_expiry?: boolean;
  @ApiPropertyOptional() primary_image_url?: string;
  @ApiPropertyOptional() thumbnail_image_url?: string;
  @ApiPropertyOptional() image_gallery_urls?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional() product_code?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() short_description?: string;
  @ApiPropertyOptional() category_id?: number;
  @ApiPropertyOptional() brand_id?: number;
  @ApiPropertyOptional() primary_uom_id?: number;
  @ApiPropertyOptional() base_price?: number;
  @ApiPropertyOptional() cost_price?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() storage_temperature_min?: number;
  @ApiPropertyOptional() storage_temperature_max?: number;
  @ApiPropertyOptional() requires_temperature_control?: boolean;
  @ApiPropertyOptional() requires_light_control?: boolean;
  @ApiPropertyOptional() requires_humidity_control?: boolean;
  @ApiPropertyOptional() is_hazardous?: boolean;
  @ApiPropertyOptional() hazmat_class?: string;
  @ApiPropertyOptional() hazmat_description?: string;
  @ApiPropertyOptional() is_perishable?: boolean;
  @ApiPropertyOptional() shelf_life_days?: number;
  @ApiPropertyOptional() track_serial_numbers?: boolean;
  @ApiPropertyOptional() track_lot_numbers?: boolean;
  @ApiPropertyOptional() abc_analysis_class?: string;
  @ApiPropertyOptional() default_cycle_count_frequency_days?: number;
  @ApiPropertyOptional() last_counted_at?: string;
  @ApiPropertyOptional() next_count_due_at?: string;
  @ApiPropertyOptional() is_sensitive?: boolean;
  @ApiPropertyOptional() sensitivity_level?: string;
  @ApiPropertyOptional() eaches_per_case?: number;
  @ApiPropertyOptional() cases_per_pallet?: number;
  @ApiPropertyOptional() preferred_pick_uom?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() track_expiry?: boolean;
  @ApiPropertyOptional() primary_image_url?: string;
  @ApiPropertyOptional() thumbnail_image_url?: string;
  @ApiPropertyOptional() image_gallery_urls?: string[];
}

export class RfProductLookupRequestDto {
  @ApiProperty() barcode: string;
}

export class RfProductLookupDto {
  @ApiProperty() productId: string;
  @ApiProperty() productCode: string;
  @ApiProperty() productName: string;
  @ApiProperty() barcode: string;
  @ApiProperty({ nullable: true })
  category: string | null;
  @ApiProperty({ nullable: true })
  uom: string | null;
}

// ─── Product Barcode DTOs ─────────────────────────────────────────────

export class CreateProductBarcodeDto {
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() variant_id?: number;
  @ApiProperty() barcode_value: string;
  @ApiPropertyOptional() barcode_type?: string;
  @ApiPropertyOptional() is_primary?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateProductBarcodeDto {
  @ApiPropertyOptional() barcode_value?: string;
  @ApiPropertyOptional() barcode_type?: string;
  @ApiPropertyOptional() is_primary?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class ProductBarcodeResponseDto {
  @ApiProperty() barcode_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() variant_id?: bigint;
  @ApiProperty() barcode_value: string;
  @ApiPropertyOptional() barcode_type?: string;
  @ApiProperty() is_primary: boolean;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}
