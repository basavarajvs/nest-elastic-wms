import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class CarrierRateDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() carrier_code: string;
  @ApiProperty() carrier_name: string;
  @ApiProperty() service_level: string;
  @ApiProperty() zone: string;
  @ApiPropertyOptional() weight_min?: number;
  @ApiPropertyOptional() weight_max?: number;
  @ApiPropertyOptional() base_rate?: number;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() transit_days?: number;
  @ApiProperty() currency: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class CarrierRatePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [CarrierRateDto] })
  data: CarrierRateDto[];
}

export class ShopResultDto {
  @ApiProperty() cheapest: any;
  @ApiProperty() fastest: any;
  @ApiProperty({ type: [Object] }) all: any[];
}

export class CreateCarrierRateDto {
  @ApiProperty() carrier_code: string;
  @ApiProperty() carrier_name: string;
  @ApiProperty() service_level: string;
  @ApiProperty() zone: string;
  @ApiPropertyOptional() weight_min?: number;
  @ApiPropertyOptional() weight_max?: number;
  @ApiPropertyOptional() base_rate?: number;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() transit_days?: number;
  @ApiPropertyOptional() currency?: string;
}

export class UpdateCarrierRateDto {
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() zone?: string;
  @ApiPropertyOptional() weight_min?: number;
  @ApiPropertyOptional() weight_max?: number;
  @ApiPropertyOptional() base_rate?: number;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() transit_days?: number;
  @ApiPropertyOptional() currency?: string;
}

export class ShopRatesDto {
  @ApiProperty({ type: [String] }) zones: string[];
  @ApiProperty() weight: number;
  @ApiPropertyOptional() service_level?: string;
}
