import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, Min, IsDateString } from 'class-validator';

export class CreateCarrierRateDto {
  @ApiProperty({ type: String })
  @IsUUID()
  carrierId: string;

  @ApiProperty({ type: String })
  @IsString()
  serviceCode: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightFrom?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightTo?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  baseRate?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  ratePerKg?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  fuelSurcharge?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  minCharge?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  transitDaysMin?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  transitDaysMax?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RateQuoteRequestDto {
  @ApiProperty({ type: String })
  @IsUUID()
  carrierId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ type: String })
  @IsString()
  destinationZone: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  serviceCodes?: string[];
}

export class CompareRatesDto {
  @ApiProperty({ type: [String] })
  @IsUUID('4', { each: true })
  carrierIds: string[];

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ type: String })
  @IsString()
  destinationZone: string;
}
