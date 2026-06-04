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

export class AdhocCountDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsEnum(['ZONE', 'LOCATION', 'PRODUCT', 'ABC_CLASS'])
  scopeType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeIdentifier?: string;

  @ApiProperty({ type: String })
  @IsEnum(['BLIND', 'KNOWN', 'SPOT', 'CONTROL_GROUP'])
  countMethod: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  autoAdjust?: boolean;

  @ApiProperty({ type: [String] })
  @IsUUID('4', { each: true })
  locationIds: string[];
}

export class BatchSubmitLinesDto {
  @ApiProperty({ type: String })
  @IsUUID()
  countId: string;

  @ApiProperty({ type: [Object] })
  lines: { lineId: string; countedQuantity: number }[];
}

export class CountSummaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string;
}

export class CreateCycleCountLineDto {
  @ApiProperty({ type: String })
  @IsUUID()
  countId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiProperty({ type: String })
  @IsUUID()
  uomId: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  systemQuantity?: number;
}

export class UpdateCycleCountLineDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  countedQuantity?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  lotId?: string;
}
