import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LevelConfigDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(1) locationsPerLevel: number;
  @ApiProperty() @IsString() locationPrefix: string;
}

class BayConfigDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(1) levelCount: number;
  @ApiProperty({ type: [LevelConfigDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => LevelConfigDto) levels: LevelConfigDto[];
}

class AisleConfigDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(1) bayCount: number;
  @ApiProperty({ type: [BayConfigDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => BayConfigDto) bays: BayConfigDto[];
}

class ZoneGenerateConfigDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(1) aisleCount: number;
  @ApiProperty({ type: [AisleConfigDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => AisleConfigDto) aisles: AisleConfigDto[];
}

export class GenerateLocationsDto {
  @ApiProperty({ type: [ZoneGenerateConfigDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => ZoneGenerateConfigDto) zones: ZoneGenerateConfigDto[];
}
