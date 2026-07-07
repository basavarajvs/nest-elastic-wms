import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class PickingTaskDto {
  @ApiProperty() task_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() task_number: string;
  @ApiPropertyOptional() task_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiPropertyOptional() order_line_id?: string;
  @ApiPropertyOptional() allocation_id?: string;
  @ApiPropertyOptional() wave_id?: string;
  @ApiPropertyOptional() wave_name?: string;
  @ApiPropertyOptional() quantity_to_pick?: number;
  @ApiPropertyOptional() quantity_picked?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() to_location_name?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() pick_type?: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() mismatch_count?: number;
  @ApiPropertyOptional() at_risk?: boolean;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() lpn_id?: string;
  @ApiPropertyOptional() lpn_number?: string;
  @ApiPropertyOptional() due_date?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() route_sequence?: number;
  @ApiPropertyOptional() cluster_group_id?: string;
  @ApiPropertyOptional() required_equipment?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_date: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class PickingTaskPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PickingTaskDto] })
  data: PickingTaskDto[];
}

export class PickingTaskDetailDto extends PickingTaskDto {
  @ApiPropertyOptional() product?: any;
  @ApiPropertyOptional() location?: any;
  @ApiPropertyOptional() orderLine?: any;
  @ApiPropertyOptional() picker?: any;
  @ApiPropertyOptional() pickType?: string;
  @ApiPropertyOptional() requestedCases?: number;
  @ApiPropertyOptional() requestedEaches?: number;
}

export class ScanResultDto {
  @ApiProperty() task: any;
  @ApiProperty() location?: any;
  @ApiProperty() product?: any;
  @ApiProperty() locationVerified?: boolean;
  @ApiProperty() productVerified?: boolean;
}

export class BackorderDto {
  @ApiProperty() backorder_id: string;
  @ApiProperty() order_line_id: string;
  @ApiProperty() shortfall_qty: number;
  @ApiProperty() status: string;
  @ApiProperty() created_at: Date;
}

export class WaveStatusDto {
  @ApiProperty() totalTasks: number;
  @ApiProperty() completedTasks: number;
  @ApiProperty() shortPicks: number;
  @ApiProperty() pending: number;
  @ApiProperty() newStatus: string;
}

export class AuditTimelineDto {
  @ApiProperty() audit_id: string;
  @ApiProperty() task_id: string;
  @ApiProperty() event_type: string;
  @ApiProperty() recorded_at: Date;
  @ApiPropertyOptional() notes?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional() notes?: string;
}

export class CancelTaskDto {
  @ApiProperty() reason: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfNextPickTaskDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfScanPickDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() barcode: string;
}

export class RfScanPickLocationDto {
  @ApiProperty() task_id: string;
  @ApiProperty() location_barcode: string;
}

export class RfScanPickProductDto {
  @ApiProperty() task_id: string;
  @ApiProperty() product_code: string;
}

export class RfAssignPickTaskDto {
  @ApiProperty() task_id: string;
  @ApiProperty() user_id: string;
}

export class RfScanToteDto {
  @ApiProperty() task_id: string;
  @ApiProperty() tote_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfConfirmPickDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() picked_quantity?: number;
  @ApiPropertyOptional() lpn_barcode?: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfConfirmPickByLpnDto {
  @ApiProperty() task_id: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfShortPickDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() picked_quantity?: number;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfMyPickTasksDto {
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfWaveStatusDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfValidatePrePickDto {
  @ApiProperty() task_id: string;
}

export class RfCreateBackorderDto {
  @ApiProperty() order_line_id: string;
  @ApiProperty() shortfall_qty: number;
}

export class RfSetupClusterDto {
  @ApiPropertyOptional() user_id?: string;
  @ApiProperty() cart_id: string;
  @ApiPropertyOptional() tote_barcodes?: string[];
}

export class RfClusterNextDto {
  @ApiProperty() session_id: string;
}

export class RfDistributePickDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() distributions?: any;
}

export class RfClusterCompleteDto {
  @ApiProperty() session_id: string;
}

export class RfBatchStartDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfBulkConfirmDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() picked_quantity?: number;
}

export class RfBatchCompleteDto {
  @ApiProperty() batch_id: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() total_items?: number;
}

export class RfScanPalletPickDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfConfirmPalletDto {
  @ApiProperty() task_id: string;
  @ApiPropertyOptional() lpn_barcode?: string;
}

export class RfNextInterleavedDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() current_location_id?: string;
}

export class RfAutoUnassignDto {
  @ApiProperty() facility_id: string;
}

export class RfResumePickDto {
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfSavePickStateDto {
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() state?: any;
}

export class RfSetEquipmentDto {
  @ApiProperty() user_id: string;
  @ApiProperty() equipment_type: string;
}

export class CreateBatchSortationDto {
  @ApiProperty() batch_id: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() total_items?: number;
  @ApiPropertyOptional() sorted_items?: number;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() completed_at?: Date;
}

export class CreatePickBatchDto {
  @ApiProperty() wave_id: string;
  @ApiPropertyOptional() status?: string;
}

export class UpdatePickBatchDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() updated_by?: string;
}

export class CreateBackorderRecordDto {
  @ApiProperty() order_line_id: string;
  @ApiProperty() shortfall_qty: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() fulfilled_qty?: number;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfNextPickTaskResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() task_number?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() quantity_to_pick?: number;
  @ApiPropertyOptional() pick_type?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfScanPickResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() task_number?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfScanPickLocationResponseDto {
  @ApiPropertyOptional({ type: Object }) task?: any;
  @ApiPropertyOptional({ type: Object }) location?: any;
  @ApiPropertyOptional() locationVerified?: boolean;
}

export class RfScanPickProductResponseDto {
  @ApiPropertyOptional({ type: Object }) task?: any;
  @ApiPropertyOptional({ type: Object }) product?: any;
  @ApiPropertyOptional() productVerified?: boolean;
}

export class RfAssignPickTaskResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfScanToteResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfConfirmPickResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() quantity_picked?: number;
}

export class RfConfirmPickByLpnResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfShortPickResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfMyPickTasksResponseDto {
  @ApiPropertyOptional({ type: [Object] }) tasks?: any[];
}

export class RfWaveStatusResponseDto {
  @ApiPropertyOptional({ type: [Object] }) tasks?: any[];
}

export class RfValidatePrePickResponseDto {
  @ApiPropertyOptional({ type: Object }) risk?: any;
}

export class RfCreateBackorderResponseDto {
  @ApiPropertyOptional() backorder_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfSetupClusterResponseDto {
  @ApiPropertyOptional() session_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfClusterNextResponseDto {
  @ApiPropertyOptional({ type: [Object] }) tasks?: any[];
}

export class RfDistributePickResponseDto {
  @ApiPropertyOptional() status?: string;
}

export class RfClusterCompleteResponseDto {
  @ApiPropertyOptional() session_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfBatchStartResponseDto {
  @ApiPropertyOptional() batch_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfBulkConfirmResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfBatchCompleteResponseDto {
  @ApiProperty() batchId: string;
  @ApiProperty() status: string;
  @ApiProperty() sortationCreated: boolean;
}

export class RfScanPalletPickResponseDto {
  @ApiProperty() valid: boolean;
  @ApiPropertyOptional({ type: Object }) lpn?: any;
}

export class RfConfirmPalletResponseDto {
  @ApiPropertyOptional() task_id?: string;
  @ApiPropertyOptional() status?: string;
}

export class RfNextInterleavedResponseDto {
  @ApiPropertyOptional({ type: Object }) task?: any;
}

export class RfAutoUnassignResponseDto {
  @ApiPropertyOptional() unassignedCount?: number;
}

export class RfResumePickResponseDto {
  @ApiPropertyOptional({ type: Object }) session?: any;
}

export class RfSavePickStateResponseDto {
  @ApiPropertyOptional() saved?: boolean;
}

export class RfSetEquipmentResponseDto {
  @ApiProperty() equipmentType: string;
  @ApiProperty() saved: boolean;
}

// ─── Web Pick Route Response DTOs ─────────────────────────

export class PickRouteViewResponseDto {
  @ApiPropertyOptional({ type: [Object] }) routes?: any[];
  @ApiPropertyOptional({ type: [Object] }) tasks?: any[];
  @ApiPropertyOptional() totalDistance?: number;
}

export class PickRouteOptimizeResponseDto {
  @ApiPropertyOptional() tasksOptimized?: number;
  @ApiPropertyOptional({ type: [Object] }) route?: any[];
}

export class UpdateBackorderRecordDto {
  @ApiPropertyOptional() shortfall_qty?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() fulfilled_qty?: number;
}

export class CreatePickRouteDto {
  @ApiProperty() wave_id: string;
  @ApiProperty() sequence_order: number;
  @ApiProperty() task_id: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() picker_id?: string;
  @ApiPropertyOptional() estimated_travel_distance?: number;
}

export class UpdatePickRouteDto {
  @ApiPropertyOptional() picker_id?: string;
  @ApiPropertyOptional() sequence_order?: number;
  @ApiPropertyOptional() estimated_travel_distance?: number;
  @ApiPropertyOptional() actual_start_time?: Date;
  @ApiPropertyOptional() actual_end_time?: Date;
}

// ─── Pick Carts ────────────────────────────────────────────

export class PickCartDto {
  @ApiProperty() cart_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() cart_code: string;
  @ApiProperty() cart_type: string;
  @ApiPropertyOptional() num_shelves?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: string;
}

export class CreatePickCartDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() cart_code: string;
  @ApiPropertyOptional() cart_type?: string;
  @ApiPropertyOptional() num_shelves?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdatePickCartDto {
  @ApiPropertyOptional() cart_code?: string;
  @ApiPropertyOptional() cart_type?: string;
  @ApiPropertyOptional() num_shelves?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── Pick Cart Assignments ─────────────────────────────────

export class PickCartAssignmentDto {
  @ApiProperty() assignment_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() cart_id: string;
  @ApiProperty() shelf_position: string;
  @ApiPropertyOptional() tote_lpn_id?: string;
  @ApiPropertyOptional() tote_barcode?: string;
  @ApiPropertyOptional() assignment_order?: number;
  @ApiPropertyOptional() session_id?: string;
  @ApiProperty() created_at: Date;
}

export class CreatePickCartAssignmentDto {
  @ApiProperty() cart_id: string;
  @ApiProperty() shelf_position: string;
  @ApiPropertyOptional() tote_lpn_id?: string;
  @ApiPropertyOptional() tote_barcode?: string;
  @ApiPropertyOptional() assignment_order?: number;
  @ApiPropertyOptional() session_id?: string;
}

export class UpdatePickCartAssignmentDto {
  @ApiPropertyOptional() shelf_position?: string;
  @ApiPropertyOptional() tote_lpn_id?: string;
  @ApiPropertyOptional() tote_barcode?: string;
  @ApiPropertyOptional() assignment_order?: number;
  @ApiPropertyOptional() session_id?: string;
}

// ─── Cluster Pick Groups ───────────────────────────────────

export class ClusterPickGroupDto {
  @ApiProperty() group_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() session_id: string;
  @ApiProperty() cart_id: string;
  @ApiPropertyOptional() wave_id?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() picker_id?: string;
  @ApiPropertyOptional() total_tasks?: number;
  @ApiPropertyOptional() completed_tasks?: number;
  @ApiProperty() created_at: Date;
  @ApiPropertyOptional() completed_at?: Date;
}

export class CreateClusterPickGroupDto {
  @ApiProperty() session_id: string;
  @ApiProperty() cart_id: string;
  @ApiPropertyOptional() wave_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() picker_id?: string;
  @ApiPropertyOptional() total_tasks?: number;
  @ApiPropertyOptional() completed_tasks?: number;
}

export class UpdateClusterPickGroupDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() picker_id?: string;
  @ApiPropertyOptional() total_tasks?: number;
  @ApiPropertyOptional() completed_tasks?: number;
  @ApiPropertyOptional() completed_at?: Date;
}

// ─── Short Pick Reasons ────────────────────────────────────

export class ShortPickReasonDto {
  @ApiProperty() reason_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() reason_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() triggers_recount?: boolean;
  @ApiPropertyOptional() triggers_investigation?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiProperty() created_at: Date;
}

export class CreateShortPickReasonDto {
  @ApiProperty() reason_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() triggers_recount?: boolean;
  @ApiPropertyOptional() triggers_investigation?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateShortPickReasonDto {
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() triggers_recount?: boolean;
  @ApiPropertyOptional() triggers_investigation?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}
