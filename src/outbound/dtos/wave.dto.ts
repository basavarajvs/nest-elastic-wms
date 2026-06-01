import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

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
