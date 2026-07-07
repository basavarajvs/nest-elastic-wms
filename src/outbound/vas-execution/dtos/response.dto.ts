import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class VasExecutionTaskDto {
  @ApiProperty() task_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() task_number: string;
  @ApiProperty() task_type: string;
  @ApiProperty() vas_service_id: string;
  @ApiProperty() service_code: string;
  @ApiProperty() service_name: string;
  @ApiPropertyOptional() vas_service_name?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() quantity_required: number;
  @ApiPropertyOptional() quantity_completed?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() order_line_id?: string;
  @ApiPropertyOptional() sales_order_line_id?: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() inventory_item_id?: string;
  @ApiPropertyOptional() source_location_id?: string;
  @ApiPropertyOptional() source_wave_id?: string;
  @ApiPropertyOptional() source_picking_task_id?: string;
  @ApiPropertyOptional() work_station_id?: string;
  @ApiPropertyOptional() work_station_name?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() assigned_at?: Date;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() scheduled_end_time?: Date;
  @ApiPropertyOptional() estimated_duration_minutes?: number;
  @ApiPropertyOptional() actual_duration_minutes?: number;
  @ApiPropertyOptional() quality_check_required?: boolean;
  @ApiPropertyOptional() quality_checked_by?: string;
  @ApiPropertyOptional() quality_checked_at?: Date;
  @ApiPropertyOptional() quality_status?: string;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() total_charge?: number;
  @ApiPropertyOptional() charge_status?: string;
  @ApiPropertyOptional() billed_at?: Date;
  @ApiPropertyOptional() invoice_id?: string;
  @ApiPropertyOptional() special_instructions?: string;
  @ApiPropertyOptional() execution_notes?: string;
  @ApiPropertyOptional() exception_notes?: string;
  @ApiPropertyOptional() attachments_json?: any;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class VasExecutionTaskPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [VasExecutionTaskDto] })
  data: VasExecutionTaskDto[];
}

export class VasExecutionChargeDto {
  @ApiProperty() charge_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() charge_number: string;
  @ApiProperty() vas_task_id: string;
  @ApiProperty() service_code: string;
  @ApiProperty() charge_status: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() line_total?: number;
  @ApiProperty() created_at: Date;
}

export class VasExecutionChargePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [VasExecutionChargeDto] })
  data: VasExecutionChargeDto[];
}

export class CreateVasTaskDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() task_number: string;
  @ApiProperty() task_type: string;
  @ApiProperty() vas_service_id: string;
  @ApiProperty() service_code: string;
  @ApiProperty() service_name: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() order_line_id?: string;
  @ApiPropertyOptional() sales_order_line_id?: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() inventory_item_id?: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() quantity_required?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() source_location_id?: string;
  @ApiPropertyOptional() source_wave_id?: string;
  @ApiPropertyOptional() source_picking_task_id?: string;
  @ApiPropertyOptional() work_station_id?: string;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() scheduled_end_time?: Date;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() estimated_duration_minutes?: number;
  @ApiPropertyOptional() quality_check_required?: boolean;
  @ApiPropertyOptional() special_instructions?: string;
  @ApiPropertyOptional() execution_notes?: string;
  @ApiPropertyOptional() exception_notes?: string;
  @ApiPropertyOptional() attachments_json?: any;
  @ApiPropertyOptional() auto_charge?: boolean;
}

export class CompleteVasTaskDto {
  @ApiPropertyOptional() quantity_completed?: number;
  @ApiPropertyOptional() actual_duration_minutes?: number;
  @ApiPropertyOptional() quality_check_required?: boolean;
  @ApiPropertyOptional() quality_checked_by?: string;
  @ApiPropertyOptional() quality_checked_at?: Date;
  @ApiPropertyOptional() quality_status?: string;
  @ApiPropertyOptional() execution_notes?: string;
  @ApiPropertyOptional() exception_notes?: string;
}
