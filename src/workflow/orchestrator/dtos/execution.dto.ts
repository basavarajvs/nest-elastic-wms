import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecutionInstanceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() machine_key: string;
  @ApiPropertyOptional() entity_type?: string;
  @ApiPropertyOptional() entity_id?: string;
  @ApiProperty() current_state: string;
  @ApiProperty() status: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class BpmnExecutionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() process_key: string;
  @ApiProperty() status: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ExecutionListResponseDto {
  @ApiProperty({ type: [ExecutionInstanceResponseDto] })
  stateMachineInstances: ExecutionInstanceResponseDto[];
  @ApiProperty({ type: [BpmnExecutionResponseDto] })
  bpmnExecutions: BpmnExecutionResponseDto[];
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
