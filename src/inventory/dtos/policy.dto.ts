import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpsertPolicyDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
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
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isActive?: boolean;
}
