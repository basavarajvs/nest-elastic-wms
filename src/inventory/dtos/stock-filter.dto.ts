import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StockFilterDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  productId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  lotId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  productSku?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  productName?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
