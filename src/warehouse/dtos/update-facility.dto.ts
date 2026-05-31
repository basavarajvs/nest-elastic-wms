import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, MaxLength } from 'class-validator';

enum FacilityTypeEnum {
  WAREHOUSE = 'WAREHOUSE',
  DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER',
  CROSS_DOCK = 'CROSS_DOCK',
  FULFILLMENT_CENTER = 'FULFILLMENT_CENTER',
}

export class UpdateFacilityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  facilityCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: FacilityTypeEnum })
  @IsOptional()
  @IsEnum(FacilityTypeEnum)
  facilityType?: FacilityTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}
