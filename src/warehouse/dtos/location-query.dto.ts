import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LocationQueryDto {
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsString()
  locationCode?: string;
}
