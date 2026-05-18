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
  @IsUUID()
  facilityId: string;

  @IsUUID()
  zoneId: string;

  @IsString()
  locationCode: string;

  @IsEnum(LocationTypeEnum)
  locationType: LocationTypeEnum;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}
