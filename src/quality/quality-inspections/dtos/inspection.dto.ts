import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, MaxLength } from 'class-validator';

export class CreateInspectionDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ enum: ['RECEIVING', 'PICKING', 'RETURN', 'ROUTINE', 'COMPLIANCE'] })
  @IsString()
  inspectionType: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  scheduledDate?: string;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInspectionResultDto {
  @ApiProperty({ enum: ['VISUAL', 'DIMENSIONAL', 'WEIGHT', 'COUNT', 'LABEL', 'DOCUMENT', 'TEST'] })
  @IsString()
  checkType: string;

  @ApiProperty({ enum: ['PASS', 'FAIL', 'N/A'] })
  @IsString()
  result: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  measuredValue?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  toleranceMin?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  toleranceMax?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaUrl?: string;
}
