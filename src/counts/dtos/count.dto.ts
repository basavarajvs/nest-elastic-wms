import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';

export class ScheduleCountDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['ZONE', 'LOCATION', 'PRODUCT', 'ABC_CLASS'])
  scopeType: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  scopeIdentifier?: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['BLIND', 'KNOWN', 'SPOT', 'CONTROL_GROUP'])
  countMethod: string;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  autoAdjust?: boolean;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsEnum(['MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ABC_DRIVEN'])
  frequencyType?: string;
}

export class SubmitCountLineDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  lineId: string;

  @IsNumber()
  @Min(0)
  countedQuantity: number;
}
