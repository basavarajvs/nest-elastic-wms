import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class AdjustmentLineDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  locationId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  lotId?: string;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  quantityBefore: number;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  quantityAdjustment: number;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  quantityAfter: number;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  uomId: string;
}

export class CreateAdjustmentDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  reasonCode: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentLineDto)
  lines: AdjustmentLineDto[];
}

export class AdjustmentFilterDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  status?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  productId?: string;
}
