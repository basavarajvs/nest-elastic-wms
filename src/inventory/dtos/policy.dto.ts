import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpsertPolicyDto {
  @IsUUID()
  facilityId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsNumber()
  @Min(0)
  reorderPoint: number;

  @IsNumber()
  @Min(0)
  maxStockLevel: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
