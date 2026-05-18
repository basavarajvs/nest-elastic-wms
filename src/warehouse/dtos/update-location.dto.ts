import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  attributes?: Record<string, any>;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  parentId?: string | null;
}
