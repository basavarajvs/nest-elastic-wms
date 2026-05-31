import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  locationId: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsUUID()
  lotId?: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ type: String })
  @IsUUID()
  uomId: string;

  @ApiProperty({ type: String })
  @IsString()
  reservationType: string;

  @ApiProperty({ type: String })
  @IsString()
  referenceType: string;

  @ApiProperty({ type: String })
  @IsString()
  referenceId: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsDateString()
  expiresAt?: string;
}

export class ReleaseReservationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  reservationId: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  status?: string;
}
