import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class QcInspectDto {
  @IsUUID()
  grnLineId: string;

  @IsEnum(['PASSED', 'FAILED'])
  qcResult: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QcDispositionDto {
  @IsUUID()
  grnLineId: string;

  @IsEnum(['ACCEPT', 'REJECT', 'QUARANTINE', 'RETURN_TO_VENDOR', 'REWORK', 'DESTROY'])
  action: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QcRfResultDto {
  @IsString()
  lpnNumber: string;

  @IsEnum(['PASSED', 'FAILED'])
  result: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
