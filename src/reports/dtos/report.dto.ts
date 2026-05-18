import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ReportType } from '../report.types';

export class ReportParamsDto {
  @IsDateString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  dateTo?: string;

  @IsUUID()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  facilityId?: string;

  @IsUUID()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  zoneId?: string;

  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  productClass?: string;

  @IsString()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  format?: 'xlsx' | 'csv';

  @IsBoolean()
  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  liveQuery?: boolean;

  @IsNumber()
  @Min(1)
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  thresholdDays?: number;
}

export class ReportRequestDto {
  @ApiProperty({ required: true })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ required: false })
  @IsOptional()
  parameters?: ReportParamsDto;
}
