import { IsString, IsOptional, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StockFilterDto {
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  lotId?: string;

  @IsOptional()
  @IsString()
  productSku?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
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
