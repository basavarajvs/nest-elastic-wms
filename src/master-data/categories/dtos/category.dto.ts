import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  categoryCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  status?: string;
}
