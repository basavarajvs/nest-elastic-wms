import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsObject, IsBoolean, MaxLength } from 'class-validator';

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

export class CreateZoneDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  zoneCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ZoneTypeEnum, default: 'BULK' })
  @IsEnum(ZoneTypeEnum)
  zoneType: ZoneTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}
