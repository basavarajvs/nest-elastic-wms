import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto, DeleteResultDto } from '../../../common/dto/paginated-response.dto';

export { DeleteResultDto };

export class ReturnItemDto {
  @ApiProperty() return_item_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() return_id: number;
  @ApiPropertyOptional() original_order_line_id: number | null;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() product_code: string | null;
  @ApiProperty() returned_quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() uom_name: string | null;
  @ApiProperty() condition_received: string;
  @ApiPropertyOptional() return_reason_detail: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() received_location_id: number | null;
  @ApiPropertyOptional() location_name: string | null;
  @ApiPropertyOptional() sampling_method: string | null;
  @ApiPropertyOptional() sampling_percentage: number | null;
  @ApiPropertyOptional() sample_size: number | null;
  @ApiPropertyOptional() total_population_quantity: number | null;
  @ApiPropertyOptional() population_result: string | null;
  @ApiPropertyOptional() requires_supervisor_review: boolean | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class ReturnDto {
  @ApiProperty() return_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() return_number: string;
  @ApiPropertyOptional() return_name: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() original_order_number: string | null;
  @ApiPropertyOptional() original_shipment_number: string | null;
  @ApiProperty() client_id: number;
  @ApiPropertyOptional() client_name: string | null;
  @ApiProperty() return_date: string;
  @ApiPropertyOptional() received_date: string | null;
  @ApiPropertyOptional() return_reason: string | null;
  @ApiProperty() return_status: string;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() total_return_value: number | null;
  @ApiPropertyOptional() total_return_quantity: number | null;
  @ApiPropertyOptional() assigned_to_user_id: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
  @ApiPropertyOptional({ type: [ReturnItemDto] })
  items?: ReturnItemDto[];
}

export class ReturnListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ReturnDto] })
  data: ReturnDto[];
}

export class RfReceiveResponseDto {
  @ApiProperty() received: boolean;
  @ApiProperty() message: string;
  @ApiPropertyOptional() dto: any;
}

export class RfDispositionResponseDto {
  @ApiProperty() disposition: string;
  @ApiProperty() message: string;
  @ApiPropertyOptional() dto: any;
}

export class RfCompleteResponseDto {
  @ApiProperty() completed: boolean;
  @ApiProperty() message: string;
}

export class CreateReturnItemDto {
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string;
  @ApiPropertyOptional() product_code: string;
  @ApiProperty() returned_quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() condition_received: string;
  @ApiPropertyOptional() return_reason_detail: string;
  @ApiPropertyOptional() sampling_method: string;
  @ApiPropertyOptional() sampling_percentage: number;
  @ApiPropertyOptional() sample_size: number;
  @ApiPropertyOptional() total_population_quantity: number;
  @ApiPropertyOptional() population_result: string;
  @ApiPropertyOptional() requires_supervisor_review: boolean;
  @ApiPropertyOptional() notes: string;
}

export class CreateReturnDto {
  @ApiProperty() rma_number: string;
  @ApiProperty() facility_id: number;
  @ApiProperty() client_id: number;
  @ApiPropertyOptional() return_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() original_order_number: string;
  @ApiPropertyOptional() original_shipment_number: string;
  @ApiPropertyOptional() return_date: string;
  @ApiPropertyOptional() reason_code: string;
  @ApiPropertyOptional() currency_code: string;
  @ApiPropertyOptional() assigned_to_user_id: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional({ type: [CreateReturnItemDto] })
  items: CreateReturnItemDto[];
}

export class UpdateReturnDto {
  @ApiPropertyOptional() reason_code: string;
  @ApiPropertyOptional() assigned_to_user_id: string;
  @ApiPropertyOptional() notes: string;
}

export class ReceiveReturnItemDto {
  @ApiProperty() return_item_id: number;
  @ApiPropertyOptional() received_location_id: number;
  @ApiPropertyOptional() condition_received: string;
  @ApiPropertyOptional() returned_quantity: number;
}

export class ReceiveReturnDto {
  @ApiPropertyOptional({ type: [ReceiveReturnItemDto] })
  items: ReceiveReturnItemDto[];
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfLookupRmaDto {
  @ApiProperty() return_number: string;
  @ApiPropertyOptional() rma_number?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfReceiveReturnDto {
  @ApiPropertyOptional() return_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() condition?: string;
}

export class RfDispositionDto {
  @ApiPropertyOptional() disposition?: string;
  @ApiPropertyOptional() return_id?: string;
  @ApiPropertyOptional() return_item_id?: string;
}

export class RfCompleteReturnDto {}
