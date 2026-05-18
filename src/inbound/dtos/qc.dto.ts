import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class QcInspectDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  grnLineId: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['PASSED', 'FAILED'])
  qcResult: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;
}

export class QcDispositionDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  grnLineId: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['ACCEPT', 'REJECT', 'QUARANTINE', 'RETURN_TO_VENDOR', 'REWORK', 'DESTROY'])
  action: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;
}

export class QcRfResultDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  lpnNumber: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['PASSED', 'FAILED'])
  result: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;
}
