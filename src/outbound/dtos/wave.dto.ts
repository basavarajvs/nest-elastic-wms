import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsArray, IsObject, IsNumber, IsEnum } from 'class-validator';

export class CreateWaveDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  selectionCriteria?: Record<string, any>;

  @IsOptional()
  @ApiProperty({ type: [String], required: false, description: 'Specific order IDs to include in this wave' })
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds?: string[];
}

export enum WaveStatusEnum {
  PLANNED = 'PLANNED',
  RELEASED = 'RELEASED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateWaveStatusDto {
  @ApiProperty({ enum: WaveStatusEnum, description: 'New wave status' })
  @IsEnum(WaveStatusEnum)
  status: WaveStatusEnum;
}
