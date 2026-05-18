import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  productId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  lotId?: string;

  @ApiProperty({ required: true })
  @IsEnum(HoldTypeDto)
  holdType: HoldTypeDto;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  reason?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  expiresAt?: string;
}

export class ReleaseHoldDto {
  @IsString()
  disposition: 'RESTORE' | 'DAMAGE' | 'QUARANTINE';
}
