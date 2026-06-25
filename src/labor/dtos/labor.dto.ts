import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() shiftCode: string;
  @ApiProperty() @IsString() shiftName: string;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() shiftName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AssignShiftDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() shiftId: string;
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsDateString() effectiveDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class ClockInDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shiftId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ClockOutDto {
  @ApiProperty() @IsString() timeLogId: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) breakDuration?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ListTimeLogsDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
}

export class ListPerformanceDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() metricDate?: string;
}
