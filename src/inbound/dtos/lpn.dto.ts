import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum LpnTypeDto {
  PALLET = 'PALLET',
  CARTON = 'CARTON',
  CASE = 'CASE',
  EACH = 'EACH',
  MIXED = 'MIXED',
}

export class NestLpnDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  childLpnId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  parentLpnId: string;
}

export class MoveLpnDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  locationId: string;
}
