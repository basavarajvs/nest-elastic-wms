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
}
