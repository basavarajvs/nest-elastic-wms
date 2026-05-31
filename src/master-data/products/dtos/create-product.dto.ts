import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsUUID, IsOptional, IsBoolean, IsInt, Min, Max, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductBarcodeDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  barcodeValue: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  type?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityPerScan?: number;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  childUomCode?: string;
}

export class CreateProductAttributeDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  key: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  productCode: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  name: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  description?: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  baseUomId: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  trackLot?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  trackSerial?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  trackExpiry?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  shelfLifeDays?: number;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
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
