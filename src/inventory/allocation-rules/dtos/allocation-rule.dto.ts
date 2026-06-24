import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllocationRuleDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsString()
  ruleName: string;

  @ApiProperty({ description: 'FIFO, FEFO, LIFO, NEAREST_LOCATION, CLIENT_PREFERRED' })
  @IsString()
  ruleType: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAllocationRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruleName?: string;

  @ApiPropertyOptional({ description: 'FIFO, FEFO, LIFO, NEAREST_LOCATION, CLIENT_PREFERRED' })
  @IsOptional()
  @IsString()
  ruleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateConstraintDto {
  @ApiProperty({ description: 'productId, clientId, zoneId, locationType' })
  @IsString()
  constraintField: string;

  @ApiProperty({ description: 'IN, NOT_IN, EQUALS, MIN, MAX' })
  @IsString()
  constraintOperator: string;

  @ApiProperty()
  @IsString()
  constraintValue: string;
}

export class CreateRuleLocationDto {
  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

export class EvaluateRulesDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty()
  @IsUUID()
  facilityId: string;
}
