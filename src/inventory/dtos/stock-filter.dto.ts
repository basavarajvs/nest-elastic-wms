import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Transforms an empty-string query param to `undefined` so that
 * @IsOptional() skips validation (class-validator only considers
 * `undefined` / `null` as absent).
 */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

/**
 * Transforms a boolean query-string value (`"true"` / `"false"`) into an
 * actual boolean, and also treats empty strings as absent.
 */
const booleanString = ({ value }: { value: unknown }) => {
  if (value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class StockFilterDto {
  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  productId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  locationId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(emptyToUndefined)
  lotId?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  productSku?: string;

  @IsOptional()
  @IsString()
  @Transform(emptyToUndefined)
  productName?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(booleanString)
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