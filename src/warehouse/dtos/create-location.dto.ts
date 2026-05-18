import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsObject } from 'class-validator';

enum LocationTypeEnum {
  PALLET = 'PALLET',
  CASE = 'CASE',
  EACH = 'EACH',
  FLOOR = 'FLOOR',
  STAGING = 'STAGING',
  DOCK = 'DOCK',
  TEMP = 'TEMP',
}

export class CreateLocationDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  locationCode: string;

  @ApiProperty({ required: true })
  @IsEnum(LocationTypeEnum)
  locationType: LocationTypeEnum;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  attributes?: Record<string, any>;
}
