import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min, IsObject, IsArray, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertStateMachineDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  machineKey: string;

  @ApiProperty({ required: true })
  @IsObject()
  definitionJson: any;
}

export class ExecuteTransitionDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  entityId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  event: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  context?: any;
}

export class UpsertRuleDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  ruleKey: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  ruleType: string;

  @ApiProperty({ required: true })
  @IsObject()
  definitionJson: any;
}

export class EvaluateRuleDto {
  @ApiProperty({ required: true })
  @IsObject()
  inputData: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: String, required: false })
  @IsString({ each: true })
  contextKeys?: string[];
}

export class UpsertBpmnProcessDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  processKey: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  bpmnXml: string;
}

export class StartProcessDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  entityType: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  entityId: string;

  @ApiProperty({ required: true })
  @IsObject()
  initialContext: Record<string, any>;
}

export class SignalProcessDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  messageName: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  context?: Record<string, any>;
}

export class ExecutionFilterDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  entityType?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  status?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
