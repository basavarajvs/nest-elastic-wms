import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

enum LpnTypeEnum {
  PALLET = 'PALLET',
  CARTON = 'CARTON',
  CASE = 'CASE',
  EACH = 'EACH',
  MIXED = 'MIXED',
}

export class CreateLpnDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsString()
  lpnNumber: string;

  @ApiProperty({ enum: LpnTypeEnum, default: 'PALLET' })
  @IsEnum(LpnTypeEnum)
  lpnType: LpnTypeEnum;

  @ApiProperty()
  @IsUUID()
  locationId: string;

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

  @ApiProperty()
  @IsUUID()
  uomId: string;
}
