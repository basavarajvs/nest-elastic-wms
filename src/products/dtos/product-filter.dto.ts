import { IsOptional, IsString, IsUUID, IsBoolean, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  velocityClass?: string;

  @IsOptional()
  @IsBoolean()
  trackLot?: boolean;

  @IsOptional()
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
