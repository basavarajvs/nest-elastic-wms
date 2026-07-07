import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBpmnProcessDto {
  @ApiProperty() process_key: string;
  @ApiProperty() name: string;
  @ApiProperty() bpmn_xml: string;
}

export class UpdateBpmnProcessDto {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() bpmn_xml?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class BpmnProcessResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty() processKey: string;
  @ApiProperty() name: string;
  @ApiProperty() version: number;
  @ApiProperty() bpmnXml: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class BpmnExecutionResultDto {
  @ApiProperty() id: string;
  @ApiProperty() processKey: string;
  @ApiProperty() status: string;
  @ApiProperty() context: any;
  @ApiProperty() variables: any;
  @ApiProperty() startedAt: Date;
}

export class StartBpmnProcessDto {
  @ApiProperty() process_key: string;
  @ApiPropertyOptional() context?: Record<string, any>;
}
