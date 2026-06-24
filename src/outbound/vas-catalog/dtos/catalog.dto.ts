import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';

export class CreateVasServiceDto {
  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(50)
  serviceCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(255)
  serviceName: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['KITTING', 'LABELING', 'PACKAGING', 'ASSEMBLY', 'INSPECTION', 'REPACK'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  defaultRate?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTimeMinutes?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVasServiceDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['KITTING', 'LABELING', 'PACKAGING', 'ASSEMBLY', 'INSPECTION', 'REPACK'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  defaultRate?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTimeMinutes?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SetClientRateDto {
  @ApiProperty({ type: String })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  clientId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  ratePerUnit: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  minCharge?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class CreateWorkstationDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(50)
  workstationCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(255)
  workstationName: string;

  @ApiProperty({ enum: ['KITTING', 'LABELING', 'ASSEMBLY', 'PACKING'] })
  @IsString()
  stationType: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  capabilities?: any;
}

export class UpdateWorkstationDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  workstationName?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  capabilities?: any;
}
