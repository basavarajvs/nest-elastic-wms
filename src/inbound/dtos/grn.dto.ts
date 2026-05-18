import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateGrnFromAsnDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  asnNumber: string;
}

export class CreateGrnAdHocDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  poNumber?: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  qcRequired?: boolean;
}

export class RfReceiveDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  grnLineId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  lpnNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damagedQuantity?: number;
}
