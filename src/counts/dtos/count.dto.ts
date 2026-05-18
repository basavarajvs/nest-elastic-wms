import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';

export class ScheduleCountDto {
  @IsUUID()
  facilityId: string;

  @IsEnum(['ZONE', 'LOCATION', 'PRODUCT', 'ABC_CLASS'])
  scopeType: string;

  @IsOptional()
  @IsString()
  scopeIdentifier?: string;

  @IsEnum(['BLIND', 'KNOWN', 'SPOT', 'CONTROL_GROUP'])
  countMethod: string;

  @IsOptional()
  @IsBoolean()
  autoAdjust?: boolean;

  @IsOptional()
  @IsEnum(['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ABC_DRIVEN'])
  frequencyType?: string;
}

export class SubmitCountLineDto {
  @IsUUID()
  lineId: string;

  @IsNumber()
  @Min(0)
  countedQuantity: number;
}
