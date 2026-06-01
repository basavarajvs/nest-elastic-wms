import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum HoldTypeDto {
  QC_PENDING = 'QC_PENDING',
  QC_FAILED = 'QC_FAILED',
  DAMAGE = 'DAMAGE',
  CYCLE_COUNT = 'CYCLE_COUNT',
  CREDIT_HOLD = 'CREDIT_HOLD',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  QUARANTINE = 'QUARANTINE',
  QA = 'QA',
  DISPUTE = 'DISPUTE',
  OTHER = 'OTHER',
  CUSTOMER_HOLD = 'CUSTOMER_HOLD',
}

export class CreateHoldDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiProperty({ type: Number, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ required: true, enum: HoldTypeDto })
  @IsEnum(HoldTypeDto)
  holdType: HoldTypeDto;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class ReleaseHoldDto {
  @IsString()
  disposition: 'RESTORE' | 'DAMAGE' | 'QUARANTINE';
}
