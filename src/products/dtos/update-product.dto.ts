import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, Max, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateBarcodeDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  barcodeValue?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  type?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantityPerScan?: number;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  childUomCode?: string;
}

class UpdateAttributeDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  key: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  value: string;
}

export class UpdateProductDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  name?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  description?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  baseUomId?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isActive?: boolean;

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
  @Type(() => UpdateBarcodeDto)
  barcodes?: UpdateBarcodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttributeDto)
  attributes?: UpdateAttributeDto[];
}
