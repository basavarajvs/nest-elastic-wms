import {
  IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductBarcodeDto {
  @IsString()
  barcodeValue: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityPerScan?: number;

  @IsOptional()
  @IsString()
  childUomCode?: string;
}

export class CreateProductAttributeDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  baseUomId: string;

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
  @Type(() => CreateProductBarcodeDto)
  barcodes?: CreateProductBarcodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  attributes?: CreateProductAttributeDto[];
}
