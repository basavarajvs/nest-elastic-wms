import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class AsnLineDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0)
  expectedQuantity: number;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  uomId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsDateString()
  expiryDate?: string;
}

export class CreateAsnDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  poNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  carrierName?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsDateString()
  expectedArrivalDate?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsnLineDto)
  lines: AsnLineDto[];
}

export class UpdateAsnStatusDto {
  @ApiProperty({ type: String, required: true })
  @IsEnum(['CREATED', 'IN_TRANSIT', 'ARRIVED', 'IN_RECEIVING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'])
  status: string;
}
