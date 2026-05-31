import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  search?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  velocityClass?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  trackLot?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 50;
}
