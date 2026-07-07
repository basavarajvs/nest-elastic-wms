import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVelocityResponseDto {
  @ApiProperty() classification_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() analysis_start_date: Date;
  @ApiProperty() analysis_end_date: Date;
  @ApiPropertyOptional() analysis_period_days?: number;
  @ApiPropertyOptional() total_orders?: number;
  @ApiPropertyOptional() total_quantity_shipped?: number;
  @ApiPropertyOptional() average_daily_quantity?: number;
  @ApiProperty() abc_class: string;
  @ApiPropertyOptional() velocity_score?: number;
  @ApiPropertyOptional() velocity_rank?: number;
  @ApiPropertyOptional() movement_type?: string;
  @ApiPropertyOptional() pick_frequency?: number;
  @ApiPropertyOptional() recommended_zone_type?: string;
  @ApiPropertyOptional() recommended_location_type?: string;
  @ApiPropertyOptional() calculated_at?: Date;
  @ApiPropertyOptional() next_calculation_due?: Date;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
}

export class CreateProductVelocityDto {
  @ApiProperty() product_id: number;
  @ApiProperty() facility_id: number;
  @ApiProperty() product_sku: string;
  @ApiProperty() analysis_start_date: string;
  @ApiProperty() analysis_end_date: string;
  @ApiPropertyOptional() analysis_period_days?: number;
  @ApiPropertyOptional() total_orders?: number;
  @ApiPropertyOptional() total_quantity_shipped?: number;
  @ApiPropertyOptional() average_daily_quantity?: number;
  @ApiPropertyOptional() abc_class?: string;
  @ApiPropertyOptional() velocity_score?: number;
  @ApiPropertyOptional() velocity_rank?: number;
  @ApiPropertyOptional() movement_type?: string;
  @ApiPropertyOptional() pick_frequency?: number;
  @ApiPropertyOptional() recommended_zone_type?: string;
  @ApiPropertyOptional() recommended_location_type?: string;
  @ApiPropertyOptional() next_calculation_due?: string;
}

export class UpdateProductVelocityDto {
  @ApiPropertyOptional() total_orders?: number;
  @ApiPropertyOptional() total_quantity_shipped?: number;
  @ApiPropertyOptional() average_daily_quantity?: number;
  @ApiPropertyOptional() abc_class?: string;
  @ApiPropertyOptional() velocity_score?: number;
  @ApiPropertyOptional() velocity_rank?: number;
  @ApiPropertyOptional() movement_type?: string;
  @ApiPropertyOptional() pick_frequency?: number;
  @ApiPropertyOptional() recommended_zone_type?: string;
  @ApiPropertyOptional() recommended_location_type?: string;
  @ApiPropertyOptional() next_calculation_due?: string;
}
