import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateRequirementDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ enum: ['FDA', 'OSHA', 'ISO', 'CUSTOM'] })
  @IsString()
  complianceType: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(100)
  requirementCode: string;

  @ApiProperty({ type: String })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: ['PRODUCT', 'LOCATION', 'FACILITY', 'PROCESS'] })
  @IsOptional()
  @IsString()
  applicableEntity?: string;

  @ApiPropertyOptional({ enum: ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] })
  @IsOptional()
  @IsString()
  frequencyType?: string;
}

export class CreateAuditDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  requirementId: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  auditedByUserId?: string;
}

export class UpdateAuditDto {
  @ApiPropertyOptional({ enum: ['SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['PASS', 'FAIL', 'CONDITIONAL'] })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  findings?: any;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  correctiveActions?: any;
}

export class CreateHazmatDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(10)
  hazardClass: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  division?: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(10)
  unNumber: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  packingGroup?: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(255)
  properShippingName: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  flashPoint?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  storageGroup?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContact?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyPhone?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  msdsUrl?: string;
}
