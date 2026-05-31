import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsUUID, MaxLength } from 'class-validator';

enum ZoneTypeEnum {
  BULK = 'BULK',
  PICKING = 'PICKING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  PACKING = 'PACKING',
  STAGING = 'STAGING',
  QC = 'QC',
  HOLD = 'HOLD',
  YARD = 'YARD',
}

export class UpdateZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  zoneCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ZoneTypeEnum })
  @IsOptional()
  @IsEnum(ZoneTypeEnum)
  zoneType?: ZoneTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}
