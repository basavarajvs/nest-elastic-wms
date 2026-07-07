import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class CreateWorkOrderDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() work_order_number: string;
  @ApiPropertyOptional() work_order_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() work_order_type?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_code?: string;
  @ApiProperty() planned_quantity: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() scheduled_start_date?: string;
  @ApiPropertyOptional() scheduled_end_date?: string;
  @ApiPropertyOptional() source_type?: string;
  @ApiPropertyOptional() source_reference_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() operations?: CreateWorkOrderOperationDto[];
  @ApiPropertyOptional() components?: CreateWorkOrderComponentDto[];
}

export class CreateWorkOrderOperationDto {
  @ApiPropertyOptional() operation_number?: number;
  @ApiProperty() operation_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() required_equipment_type?: string;
  @ApiPropertyOptional() required_skill_set?: string;
  @ApiPropertyOptional() standard_time_minutes?: number;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class CreateWorkOrderComponentDto {
  @ApiProperty() component_product_id: string;
  @ApiPropertyOptional() component_product_name?: string;
  @ApiPropertyOptional() component_product_code?: string;
  @ApiProperty() required_quantity: number;
  @ApiPropertyOptional() total_required_quantity?: number;
  @ApiPropertyOptional() remaining_required_quantity?: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateWorkOrderDto {
  @ApiPropertyOptional() work_order_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() work_order_type?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() scheduled_start_date?: string;
  @ApiPropertyOptional() scheduled_end_date?: string;
  @ApiPropertyOptional() notes?: string;
}

export class WorkOrderResponseDto {
  @ApiProperty() work_order_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() work_order_number: string;
  @ApiPropertyOptional() work_order_name?: string | null;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() work_order_type?: string | null;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string | null;
  @ApiPropertyOptional() product_code?: string | null;
  @ApiProperty() planned_quantity: number;
  @ApiPropertyOptional() fulfilled_quantity?: number | null;
  @ApiPropertyOptional() remaining_quantity?: number | null;
  @ApiProperty() uom_id: bigint;
  @ApiProperty() status: string;
  @ApiPropertyOptional() priority?: number | null;
  @ApiPropertyOptional() assigned_to_user_id?: string | null;
  @ApiPropertyOptional() created_date?: Date | null;
  @ApiPropertyOptional() released_date?: Date | null;
  @ApiPropertyOptional() scheduled_start_date?: Date | null;
  @ApiPropertyOptional() scheduled_end_date?: Date | null;
  @ApiPropertyOptional() actual_start_date?: Date | null;
  @ApiPropertyOptional() actual_end_date?: Date | null;
  @ApiPropertyOptional() completed_at?: Date | null;
  @ApiPropertyOptional() assigned_at?: Date | null;
  @ApiPropertyOptional() started_at?: Date | null;
  @ApiPropertyOptional() progress_percentage?: number | null;
  @ApiPropertyOptional() actual_duration_hours?: number | null;
  @ApiPropertyOptional() completed_items_count?: number | null;
  @ApiPropertyOptional() source_type?: string | null;
  @ApiPropertyOptional() source_reference_id?: bigint | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint | null;
}

export class WorkOrderOperationResponseDto {
  @ApiProperty() operation_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() work_order_id: bigint;
  @ApiProperty() operation_number: number;
  @ApiProperty() operation_name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() required_equipment_type?: string | null;
  @ApiPropertyOptional() required_skill_set?: string | null;
  @ApiPropertyOptional() standard_time_minutes?: number | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() assigned_to_user_id?: string | null;
  @ApiPropertyOptional() started_at?: Date | null;
  @ApiPropertyOptional() completed_at?: Date | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint | null;
}

export class WorkOrderComponentResponseDto {
  @ApiProperty() component_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() work_order_id: bigint;
  @ApiProperty() component_product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() component_product_name?: string | null;
  @ApiPropertyOptional() component_product_code?: string | null;
  @ApiProperty() required_quantity: number;
  @ApiPropertyOptional() total_required_quantity?: number | null;
  @ApiPropertyOptional() issued_quantity?: number | null;
  @ApiPropertyOptional() remaining_required_quantity?: number | null;
  @ApiProperty() uom_id: bigint;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes?: string | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: bigint | null;
}

export class WorkOrderPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [WorkOrderResponseDto] })
  data: WorkOrderResponseDto[];
}

export class WorkOrderOperationPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [WorkOrderOperationResponseDto] })
  data: WorkOrderOperationResponseDto[];
}

export class StartOperationDto {
  @ApiProperty() operation_id: string;
}

export class ActionResponseDto {
  @ApiProperty() success: boolean;
  @ApiProperty() message: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfMyTasksDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfStartOperationDto {
  @ApiProperty() operation_id: string;
}

export class RfCompleteOperationDto {
  @ApiProperty() operation_id: string;
}
