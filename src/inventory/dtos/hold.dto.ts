import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum HoldTypeDto {
  QC_PENDING = 'QC_PENDING',
  QC_FAILED = 'QC_FAILED',
  DAMAGE = 'DAMAGE',
  CYCLE_COUNT = 'CYCLE_COUNT',
  CREDIT_HOLD = 'CREDIT_HOLD',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  QUARANTINE = 'QUARANTINE',
}

export class CreateHoldDto {
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  lotId?: string;

  @IsEnum(HoldTypeDto)
  holdType: HoldTypeDto;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class ReleaseHoldDto {
  @IsString()
  disposition: 'RESTORE' | 'DAMAGE' | 'QUARANTINE';
}
