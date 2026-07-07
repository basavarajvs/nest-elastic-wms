import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStateMachineDto {
  @ApiProperty() machine_key: string;
  @ApiProperty() name: string;
  @ApiProperty() definition_json: any;
}

export class UpdateStateMachineDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() definition_json?: any;
  @ApiPropertyOptional() is_active?: boolean;
}

export class StateMachineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() machineKey: string;
  @ApiProperty() name: string;
  @ApiProperty() version: number;
  @ApiProperty() definitionJson: any;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ExecuteStateMachineDto {
  @ApiProperty() machine_key: string;
  @ApiProperty() entity_type: string;
  @ApiProperty() entity_id: string;
  @ApiPropertyOptional() context?: any;
}

export class ExecutionInstanceResultDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() machineKey: string;
  @ApiProperty() entityType: string;
  @ApiProperty() entityId: string;
  @ApiProperty() currentState: string;
  @ApiPropertyOptional() context?: any;
  @ApiPropertyOptional() history?: any;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
