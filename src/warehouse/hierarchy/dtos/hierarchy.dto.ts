import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateAisleDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty()
  @IsString()
  aisleCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateAisleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aisleCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBayDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty()
  @IsUUID()
  aisleId: string;

  @ApiProperty()
  @IsString()
  bayCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateBayDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bayCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRackDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty()
  @IsUUID()
  aisleId: string;

  @ApiProperty()
  @IsUUID()
  bayId: string;

  @ApiProperty()
  @IsString()
  rackCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateRackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rackCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLevelDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty()
  @IsUUID()
  aisleId: string;

  @ApiProperty()
  @IsUUID()
  bayId: string;

  @ApiProperty()
  @IsUUID()
  rackId: string;

  @ApiProperty()
  @IsString()
  levelCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateLevelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  levelCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
