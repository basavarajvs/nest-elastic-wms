import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRuleDto {
  @ApiProperty() rule_key: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() rule_type?: string;
  @ApiProperty() definition_json: any;
}

export class UpdateRuleDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() definition_json?: any;
  @ApiPropertyOptional() is_active?: boolean;
}

export class RuleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() ruleKey: string;
  @ApiProperty() name: string;
  @ApiProperty() ruleType: string;
  @ApiProperty() definitionJson: any;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class EvaluateRuleDto {
  @ApiProperty() rule_key: string;
  @ApiProperty() input: Record<string, any>;
}

export class RuleResultDto {
  @ApiProperty() matched: boolean;
  @ApiProperty({ type: [Object] })
  results: any[];
  @ApiProperty()
  hitPolicy: string;
}
