import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, IsArray, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class AsnLineDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0)
  expectedQuantity: number;

  @IsUUID()
  uomId: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateAsnDto {
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  poNumber?: string;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsDateString()
  expectedArrivalDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsnLineDto)
  lines: AsnLineDto[];
}

export class UpdateAsnStatusDto {
  @IsEnum(['CREATED', 'IN_TRANSIT', 'ARRIVED', 'IN_RECEIVING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'])
  status: string;
}
