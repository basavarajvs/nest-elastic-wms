import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

export class LpnFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string;

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
  @IsEnum(LpnStatusEnum)
  status?: LpnStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(LpnStatusEnum, { each: true })
  statusIn?: LpnStatusEnum[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
