import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class FulfillmentWorkflowDefinitionDto {
  @ApiProperty() workflow_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() workflow_code: string;
  @ApiProperty() workflow_name: string;
  @ApiPropertyOptional() workflow_description: string | null;
  @ApiProperty() entity_type: string;
  @ApiProperty() initial_status: string;
  @ApiPropertyOptional() auto_progression_enabled: boolean | null;
  @ApiPropertyOptional() require_manual_approval: boolean | null;
  @ApiPropertyOptional() max_retry_attempts: number | null;
  @ApiPropertyOptional() retry_delay_seconds: number | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class WorkflowDefinitionListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [FulfillmentWorkflowDefinitionDto] })
  data: FulfillmentWorkflowDefinitionDto[];
}

export class FulfillmentWorkflowEventDto {
  @ApiProperty() event_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() workflow_id: number;
  @ApiProperty() entity_type: string;
  @ApiProperty() entity_id: number;
  @ApiPropertyOptional() entity_reference: string | null;
  @ApiPropertyOptional() from_status: string | null;
  @ApiProperty() to_status: string;
  @ApiPropertyOptional() event_payload: any | null;
  @ApiPropertyOptional() event_status: string | null;
  @ApiPropertyOptional() scheduled_at: string | null;
  @ApiPropertyOptional() processed_at: string | null;
  @ApiPropertyOptional() handler_name: string | null;
  @ApiPropertyOptional() handler_result: any | null;
  @ApiPropertyOptional() error_message: string | null;
  @ApiPropertyOptional() retry_count: number | null;
  @ApiPropertyOptional() max_retries: number | null;
  @ApiPropertyOptional() next_retry_at: string | null;
  @ApiPropertyOptional() triggered_by_user_id: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() version: number | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
}

export class FulfillmentWorkflowExecutionDto {
  @ApiProperty() execution_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() workflow_event_id: number;
  @ApiProperty() handler_name: string;
  @ApiPropertyOptional() started_at: string | null;
  @ApiPropertyOptional() completed_at: string | null;
  @ApiPropertyOptional() execution_status: string | null;
  @ApiPropertyOptional() entities_created: any | null;
  @ApiPropertyOptional() actions_performed: any | null;
  @ApiPropertyOptional() error_message: string | null;
  @ApiPropertyOptional() error_stack_trace: string | null;
  @ApiPropertyOptional() retries_attempted: number | null;
  @ApiPropertyOptional() parent_execution_id: number | null;
  @ApiPropertyOptional() version: number | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional({ type: FulfillmentWorkflowEventDto }) fulfillment_workflow_events: FulfillmentWorkflowEventDto | null;
}

export class WorkflowExecutionListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [FulfillmentWorkflowExecutionDto] })
  data: FulfillmentWorkflowExecutionDto[];
}

export class FulfillmentWorkflowTransitionDto {
  @ApiProperty() transition_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() workflow_id: number;
  @ApiProperty() from_status: string;
  @ApiProperty() to_status: string;
  @ApiPropertyOptional() transition_name: string | null;
  @ApiPropertyOptional() condition_expression: string | null;
  @ApiPropertyOptional() require_approval: boolean | null;
  @ApiPropertyOptional() automation_handler: string | null;
  @ApiPropertyOptional() automation_enabled: boolean | null;
  @ApiPropertyOptional() priority: number | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class FulfillmentBillingRunCountDto {
  @ApiProperty() fulfillment_billing_run_events: number;
}

export class FulfillmentBillingRunDto {
  @ApiProperty() billing_run_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() run_number: string;
  @ApiProperty() run_type: string;
  @ApiProperty() run_start_date: string;
  @ApiProperty() run_end_date: string;
  @ApiPropertyOptional() execution_status: string | null;
  @ApiPropertyOptional() started_at: string | null;
  @ApiPropertyOptional() completed_at: string | null;
  @ApiPropertyOptional() events_processed: number | null;
  @ApiPropertyOptional() invoices_generated: number | null;
  @ApiPropertyOptional() total_amount: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() error_message: string | null;
  @ApiPropertyOptional() initiated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional({ type: FulfillmentBillingRunCountDto }) _count: FulfillmentBillingRunCountDto | null;
}

export class BillingRunListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [FulfillmentBillingRunDto] })
  data: FulfillmentBillingRunDto[];
}

export class FulfillmentBillingEventDto {
  @ApiProperty() billing_event_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() event_type: string;
  @ApiProperty() event_category: string;
  @ApiProperty() source_entity_type: string;
  @ApiProperty() source_entity_id: number;
  @ApiPropertyOptional() source_entity_reference: string | null;
  @ApiProperty() client_id: number;
  @ApiPropertyOptional() client_name?: string;
  @ApiProperty() charge_amount: number;
  @ApiPropertyOptional() charge_quantity: number | null;
  @ApiPropertyOptional() charge_rate: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() charge_description: string | null;
  @ApiPropertyOptional() charge_details: any | null;
  @ApiPropertyOptional() billing_status: string | null;
  @ApiPropertyOptional() billed_at: string | null;
  @ApiPropertyOptional() billing_run_id: number | null;
  @ApiPropertyOptional() billing_run_number?: string;
  @ApiPropertyOptional() invoice_id: number | null;
  @ApiProperty() event_date: string;
  @ApiPropertyOptional() event_timestamp: string | null;
  @ApiPropertyOptional() created_at: string | null;
}

export class BillingEventListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [FulfillmentBillingEventDto] })
  data: FulfillmentBillingEventDto[];
}

export class FulfillmentBillingRunEventDto {
  @ApiProperty() run_event_id: number;
  @ApiProperty() billing_run_id: number;
  @ApiProperty() billing_event_id: number;
  @ApiPropertyOptional() processed_at: string | null;
  @ApiPropertyOptional() invoice_id: number | null;
  @ApiPropertyOptional() invoice_line_id: number | null;
  @ApiPropertyOptional({ type: FulfillmentBillingEventDto }) fulfillment_billing_events: FulfillmentBillingEventDto | null;
}

export class FulfillmentBillingRunDetailDto {
  @ApiProperty() billing_run_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() run_number: string;
  @ApiProperty() run_type: string;
  @ApiProperty() run_start_date: string;
  @ApiProperty() run_end_date: string;
  @ApiPropertyOptional() execution_status: string | null;
  @ApiPropertyOptional() started_at: string | null;
  @ApiPropertyOptional() completed_at: string | null;
  @ApiPropertyOptional() events_processed: number | null;
  @ApiPropertyOptional() invoices_generated: number | null;
  @ApiPropertyOptional() total_amount: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() error_message: string | null;
  @ApiPropertyOptional() initiated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional({ type: [FulfillmentBillingRunEventDto] }) fulfillment_billing_run_events: FulfillmentBillingRunEventDto[] | null;
}

export class LinkEventsResultDto {
  @ApiProperty() linked: number;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty() workflow_code: string;
  @ApiProperty() workflow_name: string;
  @ApiPropertyOptional() workflow_description?: string;
  @ApiProperty() entity_type: string;
  @ApiProperty() initial_status: string;
  @ApiPropertyOptional() auto_progression_enabled?: boolean;
  @ApiPropertyOptional() require_manual_approval?: boolean;
  @ApiPropertyOptional() max_retry_attempts?: number;
  @ApiPropertyOptional() retry_delay_seconds?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateWorkflowDefinitionDto {
  @ApiPropertyOptional() workflow_name?: string;
  @ApiPropertyOptional() workflow_description?: string;
  @ApiPropertyOptional() auto_progression_enabled?: boolean;
  @ApiPropertyOptional() require_manual_approval?: boolean;
  @ApiPropertyOptional() max_retry_attempts?: number;
  @ApiPropertyOptional() retry_delay_seconds?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreateFulfillmentBillingRunDto {
  @ApiProperty() run_type: string;
  @ApiProperty() run_start_date: string;
  @ApiProperty() run_end_date: string;
  @ApiPropertyOptional() currency_code?: string;
}

export class CreateFulfillmentBillingEventDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() event_type: string;
  @ApiProperty() event_category: string;
  @ApiProperty() source_entity_type: string;
  @ApiProperty() source_entity_id: string;
  @ApiPropertyOptional() source_entity_reference?: string;
  @ApiProperty() client_id: string;
  @ApiProperty() charge_amount: number;
  @ApiPropertyOptional() charge_quantity?: number;
  @ApiPropertyOptional() charge_rate?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() charge_description?: string;
  @ApiPropertyOptional() charge_details?: any;
  @ApiProperty() event_date: string;
}

export class FulfillmentBillingAggregationSumDto {
  @ApiPropertyOptional() charge_amount: number | null;
  @ApiPropertyOptional() charge_quantity: number | null;
}

export class FulfillmentBillingAggregationDto {
  @ApiProperty({ type: FulfillmentBillingAggregationSumDto })
  _sum: FulfillmentBillingAggregationSumDto;
  @ApiProperty()
  _count: number;
}
