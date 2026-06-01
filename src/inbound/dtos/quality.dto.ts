import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class ListInspectionsDto {
  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  grnLineId?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @ApiPropertyOptional()
  page?: number;

  @IsOptional()
  @ApiPropertyOptional()
  limit?: number;
}
