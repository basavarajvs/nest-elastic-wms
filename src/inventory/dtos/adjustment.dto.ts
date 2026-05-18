import { IsString, IsUUID, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class AdjustmentLineDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsUUID()
  lotId?: string;

  @IsNumber()
  quantityBefore: number;

  @IsNumber()
  quantityAdjustment: number;

  @IsNumber()
  quantityAfter: number;

  @IsUUID()
  uomId: string;
}

export class CreateAdjustmentDto {
  @IsUUID()
  facilityId: string;

  @IsString()
  reasonCode: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentLineDto)
  lines: AdjustmentLineDto[];
}

export class AdjustmentFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}
