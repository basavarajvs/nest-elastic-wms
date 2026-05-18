import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum LpnTypeDto {
  PALLET = 'PALLET',
  CARTON = 'CARTON',
  CASE = 'CASE',
  EACH = 'EACH',
  MIXED = 'MIXED',
}

export class NestLpnDto {
  @IsUUID()
  childLpnId: string;

  @IsUUID()
  parentLpnId: string;
}

export class MoveLpnDto {
  @IsUUID()
  locationId: string;
}
