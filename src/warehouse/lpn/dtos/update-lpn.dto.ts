import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

enum LpnStatusEnum {
  RECEIVED = 'RECEIVED',
  IN_STAGING = 'IN_STAGING',
  IN_QC = 'IN_QC',
  PUTAWAY_PENDING = 'PUTAWAY_PENDING',
  STORED = 'STORED',
  QUARANTINED = 'QUARANTINED',
  CONSUMED = 'CONSUMED',
  DISPOSED = 'DISPOSED',
  NESTED = 'NESTED',
}

export class UpdateLpnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ enum: LpnStatusEnum })
  @IsOptional()
  @IsEnum(LpnStatusEnum)
  status?: LpnStatusEnum;
}
