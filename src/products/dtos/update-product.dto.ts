import {
  IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, Max, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateBarcodeDto {
  @IsOptional()
  @IsString()
  barcodeValue?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityPerScan?: number;
}

class UpdateAttributeDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  baseUomId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  trackLot?: boolean;

  @IsOptional()
  @IsBoolean()
  trackSerial?: boolean;

  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  shelfLifeDays?: number;

  @IsOptional()
  @IsString()
  velocityClass?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBarcodeDto)
  barcodes?: UpdateBarcodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttributeDto)
  attributes?: UpdateAttributeDto[];
}
