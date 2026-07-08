import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

// ─── Inventory Transactions ────────────────────────────────

export class InventoryTransactionResponseDto {
  @ApiProperty() transaction_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() to_location_name?: string;
  @ApiPropertyOptional() item_id?: string;
  @ApiProperty() transaction_type: string;
  @ApiProperty() transaction_status: string;
  @ApiProperty() quantity: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() uom_name?: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() performed_by_user_id?: string;
  @ApiPropertyOptional() transaction_timestamp?: Date;
  @ApiPropertyOptional() owner_client_id?: string;
  @ApiPropertyOptional() reference_document_type?: string;
  @ApiPropertyOptional() reference_document_number?: string;
  @ApiPropertyOptional() reference_line_number?: number;
  @ApiPropertyOptional() adjustment_notes?: string;
  @ApiPropertyOptional() adjustment_reason?: string;
  @ApiPropertyOptional() quantity_before?: number;
  @ApiPropertyOptional() quantity_after?: number;
  @ApiPropertyOptional() cost_adjustment?: number;
  @ApiPropertyOptional() quality_status?: string;
  @ApiPropertyOptional() inspection_notes?: string;
  @ApiPropertyOptional() serial_number?: string;
  @ApiPropertyOptional() expiration_date?: Date;
  @ApiPropertyOptional() manufacturing_date?: Date;
  @ApiPropertyOptional() unit_cost?: number;
  @ApiPropertyOptional() total_cost?: number;
  @ApiPropertyOptional() quantity_uom?: string;
  @ApiPropertyOptional() custom_attributes?: string;
  @ApiPropertyOptional() transaction_date?: Date;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryTransactionResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryTransactionResponseDto] })
  data: InventoryTransactionResponseDto[];
}

export class CreateInventoryTransactionDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() transaction_type: string;
  @ApiProperty() product_id: string;
  @ApiProperty() quantity: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() item_id?: string;
  @ApiPropertyOptional() transaction_status?: string;
  @ApiPropertyOptional() owner_client_id?: string;
  @ApiPropertyOptional() reference_document_type?: string;
  @ApiPropertyOptional() reference_document_number?: string;
  @ApiPropertyOptional() reference_line_number?: number;
  @ApiPropertyOptional() adjustment_notes?: string;
  @ApiPropertyOptional() adjustment_reason?: string;
  @ApiPropertyOptional() quantity_before?: number;
  @ApiPropertyOptional() quantity_after?: number;
  @ApiPropertyOptional() cost_adjustment?: number;
  @ApiPropertyOptional() quality_status?: string;
  @ApiPropertyOptional() inspection_notes?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() serial_number?: string;
  @ApiPropertyOptional() expiration_date?: Date;
  @ApiPropertyOptional() manufacturing_date?: Date;
  @ApiPropertyOptional() unit_cost?: number;
  @ApiPropertyOptional() total_cost?: number;
  @ApiPropertyOptional() quantity_uom?: string;
  @ApiPropertyOptional() custom_attributes?: string;
  @ApiPropertyOptional() transaction_date?: Date;
}

// ─── Inventory Lots ────────────────────────────────────────

export class InventoryLotResponseDto {
  @ApiProperty() lot_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() lot_number: string;
  @ApiPropertyOptional() supplier_lot_number?: string;
  @ApiPropertyOptional() manufacturing_date?: Date;
  @ApiPropertyOptional() expiry_date?: Date;
  @ApiProperty() received_date: Date;
  @ApiProperty() received_quantity: number;
  @ApiProperty() remaining_quantity: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() owner_client_id?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryLotResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryLotResponseDto] })
  data: InventoryLotResponseDto[];
}

export class CreateLotDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() lot_number: string;
  @ApiPropertyOptional() supplier_lot_number?: string;
  @ApiPropertyOptional() manufacture_date?: Date;
  @ApiPropertyOptional() expiry_date?: Date;
  @ApiPropertyOptional() received_date?: Date;
  @ApiPropertyOptional() received_quantity?: number;
  @ApiPropertyOptional() remaining_quantity?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() owner_client_id?: string;
}

export class UpdateLotDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() supplier_lot_number?: string;
  @ApiPropertyOptional() manufacture_date?: Date;
  @ApiPropertyOptional() expiry_date?: Date;
  @ApiPropertyOptional() received_date?: Date;
  @ApiPropertyOptional() received_quantity?: number;
  @ApiPropertyOptional() remaining_quantity?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() owner_client_id?: string;
}

// ─── Adjustment Lines ──────────────────────────────────────

export class AdjustmentLineResponseDto {
  @ApiProperty() adjustment_line_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() adjustment_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiProperty() quantity_before_adjustment: number;
  @ApiProperty() quantity_adjustment: number;
  @ApiPropertyOptional() quantity_after_adjustment?: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() uom_name?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: number;
}

export class AdjustmentLineDto {
  @ApiProperty() product_id: string;
  @ApiProperty() location_id: string;
  @ApiProperty() quantity: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() quantity_before_adjustment?: number;
  @ApiPropertyOptional() quantity_after_adjustment?: number;
  @ApiPropertyOptional() notes?: string;
}

// ─── Inventory Adjustments ─────────────────────────────────

export class InventoryAdjustmentResponseDto {
  @ApiProperty() adjustment_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() adjustment_number: string;
  @ApiPropertyOptional() adjustment_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() status: string;
  @ApiProperty() adjustment_type: string;
  @ApiProperty() reason_code: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() requested_by_user_id?: string;
  @ApiPropertyOptional() approved_by_user_id?: string;
  @ApiPropertyOptional() executed_by_user_id?: string;
  @ApiPropertyOptional() requested_date?: Date;
  @ApiPropertyOptional() approved_date?: Date;
  @ApiPropertyOptional() executed_date?: Date;
  @ApiPropertyOptional() total_lines?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryAdjustmentResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryAdjustmentResponseDto] })
  data: InventoryAdjustmentResponseDto[];
}

export class CreateAdjustmentDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() adjustment_type: string;
  @ApiPropertyOptional() adjustment_number?: string;
  @ApiPropertyOptional() adjustment_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() requested_by_user_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty({ type: [AdjustmentLineDto] })
  lines: AdjustmentLineDto[];
}

// ─── LPNs ──────────────────────────────────────────────────

export class LpnResponseDto {
  @ApiProperty() lpn_id: string;
  @ApiProperty() lpn_number: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() parent_lpn_id?: string;
  @ApiPropertyOptional() lpn_type?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() grn_line_id?: string;
  @ApiPropertyOptional() gross_weight?: number;
  @ApiPropertyOptional() net_weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() assigned_shipment_id?: string;
  @ApiPropertyOptional() assigned_load_id?: string;
  @ApiPropertyOptional() staged_at?: Date;
  @ApiPropertyOptional() staging_location_id?: string;
  @ApiPropertyOptional() loaded_at?: Date;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedLpnResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [LpnResponseDto] })
  data: LpnResponseDto[];
}

export class LpnTransactionResponseDto {
  @ApiProperty() transaction_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() lpn_id: string;
  @ApiProperty() transaction_type: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() to_location_name?: string;
  @ApiPropertyOptional() from_status?: string;
  @ApiPropertyOptional() to_status?: string;
  @ApiPropertyOptional() reference_document_type?: string;
  @ApiPropertyOptional() reference_document_number?: string;
  @ApiProperty() performed_by_user_id: string;
  @ApiPropertyOptional() transaction_time?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() version?: number;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
}

export class CreateLpnDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() lpn_number: string;
  @ApiProperty() location_id: string;
  @ApiProperty() lpn_type: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() parent_lpn_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() grn_line_id?: string;
  @ApiPropertyOptional() gross_weight?: number;
  @ApiPropertyOptional() net_weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() assigned_shipment_id?: string;
  @ApiPropertyOptional() assigned_load_id?: string;
  @ApiPropertyOptional() staging_location_id?: string;
}

export class UpdateLpnDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() lpn_number?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() parent_lpn_id?: string;
  @ApiPropertyOptional() lpn_type?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() grn_line_id?: string;
  @ApiPropertyOptional() gross_weight?: number;
  @ApiPropertyOptional() net_weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() assigned_shipment_id?: string;
  @ApiPropertyOptional() assigned_load_id?: string;
  @ApiPropertyOptional() staging_location_id?: string;
  @ApiPropertyOptional() staged_at?: Date;
  @ApiPropertyOptional() loaded_at?: Date;
}

// ─── Cycle Counts ──────────────────────────────────────────

export class CycleCountResponseDto {
  @ApiProperty() count_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() count_number: string;
  @ApiPropertyOptional() count_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() count_scope_type: string;
  @ApiPropertyOptional() count_scope_identifier?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() scheduled_date?: Date;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() variance_threshold_percentage?: number;
  @ApiPropertyOptional() auto_adjust_on_variance?: boolean;
  @ApiPropertyOptional() total_items_counted?: number;
  @ApiPropertyOptional() total_variances?: number;
  @ApiPropertyOptional() total_variance_quantity?: number;
  @ApiPropertyOptional() count_method?: string;
  @ApiPropertyOptional() count_frequency_type?: string;
  @ApiPropertyOptional() count_frequency_value?: number;
  @ApiPropertyOptional() count_priority?: string;
  @ApiPropertyOptional() auto_generated?: boolean;
  @ApiPropertyOptional() last_auto_generated_date?: Date;
  @ApiPropertyOptional() next_scheduled_date?: Date;
  @ApiPropertyOptional() sampling_method?: string;
  @ApiPropertyOptional() sample_size_percentage?: number;
  @ApiPropertyOptional() accuracy_percentage?: number;
  @ApiProperty() is_blind_count: boolean;
  @ApiPropertyOptional() parent_count_id?: string;
  @ApiPropertyOptional() count_type?: string;
  @ApiPropertyOptional() excluded_user_id?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedCycleCountResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [CycleCountResponseDto] })
  data: CycleCountResponseDto[];
}

export class CycleCountLineResponseDto {
  @ApiProperty() count_line_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() count_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiProperty() counted_quantity: number;
  @ApiProperty() system_quantity: number;
  @ApiPropertyOptional() variance_quantity?: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() adjustment_transaction_id?: string;
  @ApiPropertyOptional() counted_by_user_id?: string;
  @ApiPropertyOptional() counted_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() approved_by?: string;
  @ApiPropertyOptional() approved_at?: Date;
  @ApiPropertyOptional() draft_quantity?: number;
  @ApiProperty() is_final: boolean;
  @ApiPropertyOptional() count_round?: number;
  @ApiPropertyOptional() is_repeat_variance?: boolean;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class CreateCycleCountDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() count_scope_type: string;
  @ApiProperty() count_scope_identifier: string;
  @ApiPropertyOptional() count_type?: string;
  @ApiPropertyOptional() is_blind_count?: boolean;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() count_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() count_method?: string;
  @ApiPropertyOptional() count_priority?: string;
  @ApiPropertyOptional() count_frequency_type?: string;
  @ApiPropertyOptional() count_frequency_value?: number;
  @ApiPropertyOptional() scheduled_date?: Date;
  @ApiPropertyOptional() variance_threshold_percentage?: number;
  @ApiPropertyOptional() auto_adjust_on_variance?: boolean;
  @ApiPropertyOptional() sampling_method?: string;
  @ApiPropertyOptional() sample_size_percentage?: number;
  @ApiPropertyOptional() auto_generated?: boolean;
  @ApiPropertyOptional() excluded_user_id?: string;
  @ApiPropertyOptional() parent_count_id?: string;
}

export class UpdateCycleCountDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() count_scope_type?: string;
  @ApiPropertyOptional() count_scope_identifier?: string;
  @ApiPropertyOptional() count_type?: string;
  @ApiPropertyOptional() is_blind_count?: boolean;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() count_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() count_method?: string;
  @ApiPropertyOptional() count_priority?: string;
  @ApiPropertyOptional() count_frequency_type?: string;
  @ApiPropertyOptional() count_frequency_value?: number;
  @ApiPropertyOptional() scheduled_date?: Date;
  @ApiPropertyOptional() variance_threshold_percentage?: number;
  @ApiPropertyOptional() auto_adjust_on_variance?: boolean;
  @ApiPropertyOptional() sampling_method?: string;
  @ApiPropertyOptional() sample_size_percentage?: number;
  @ApiPropertyOptional() auto_generated?: boolean;
  @ApiPropertyOptional() excluded_user_id?: string;
  @ApiPropertyOptional() parent_count_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() total_items_counted?: number;
  @ApiPropertyOptional() total_variances?: number;
  @ApiPropertyOptional() total_variance_quantity?: number;
  @ApiPropertyOptional() accuracy_percentage?: number;
  @ApiPropertyOptional() next_scheduled_date?: Date;
  @ApiPropertyOptional() last_auto_generated_date?: Date;
}

export class SubmitCycleCountLineDto {
  @ApiProperty() product_id: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiProperty() counted_quantity: number;
  @ApiPropertyOptional() system_quantity?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() is_final?: boolean;
  @ApiPropertyOptional() count_round?: number;
  @ApiPropertyOptional() is_repeat_variance?: boolean;
}

export class SubmitLineResponseDto {
  @ApiProperty({ type: CycleCountLineResponseDto })
  line: any;
  @ApiProperty() matchStatus: string;
  @ApiProperty() systemQty: number;
  @ApiProperty() countedQty: number;
  @ApiProperty() variance: number;
  @ApiProperty() variancePct: number;
  @ApiProperty() thresholdAction: string;
  @ApiProperty({ required: false }) thresholdReason?: string;
  @ApiProperty() autoApproved: boolean;
  @ApiProperty() requiresRecount: boolean;
  @ApiProperty() requiresSupervisorApproval: boolean;
  @ApiProperty() isSensitiveInventory: boolean;
  @ApiProperty() isEmptyLocation: boolean;
  @ApiProperty() isRepeatVariance: boolean;
  @ApiProperty() repeatVarianceCount: number;
}

export class CountProgressResponseDto {
  @ApiProperty() counted: number;
  @ApiProperty() draft: number;
  @ApiProperty() total: number;
}

export class RejectVarianceDto {
  @ApiPropertyOptional() reason?: string;
}

export class CompareRecountDto {
  @ApiProperty() recount_count_id: string;
}

export class CompareRecountResponseDto {
  @ApiProperty() allAgree: boolean;
  @ApiProperty({ type: [Object] }) results: any[];
}

export class GetNextCountWorkDto {
  @ApiProperty() facility_id: string;
}

export class SaveDraftLineDto {
  @ApiProperty() product_id: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() counted_quantity?: number;
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() notes?: string;
}

// ─── Variance Investigations ───────────────────────────────

export class VarianceInvestigationResponseDto {
  @ApiProperty() investigation_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() count_id: string;
  @ApiPropertyOptional() count_number?: string;
  @ApiPropertyOptional() accuracy_history_id?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() location_code?: string;
  @ApiProperty() variance_quantity: number;
  @ApiProperty() variance_percentage: number;
  @ApiProperty() system_quantity: number;
  @ApiProperty() counted_quantity: number;
  @ApiPropertyOptional() variance_reason?: string;
  @ApiPropertyOptional() root_cause?: string;
  @ApiPropertyOptional() investigation_notes?: string;
  @ApiPropertyOptional() corrective_action?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() assigned_to_name?: string;
  @ApiPropertyOptional() assigned_at?: Date;
  @ApiPropertyOptional() investigated_by?: string;
  @ApiPropertyOptional() investigated_by_name?: string;
  @ApiPropertyOptional() investigated_at?: Date;
  @ApiPropertyOptional() resolved_at?: Date;
  @ApiPropertyOptional() days_to_resolve?: number;
  @ApiPropertyOptional() is_recurring_variance?: boolean;
  @ApiPropertyOptional() occurrences_last_30_days?: number;
  @ApiPropertyOptional() occurrences_last_90_days?: number;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

// ─── Inventory Allocations ─────────────────────────────────

export class InventoryAllocationResponseDto {
  @ApiProperty() allocation_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() item_id?: string;
  @ApiProperty() quantity_allocated: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() uom_name?: string;
  @ApiProperty() allocation_type: string;
  @ApiProperty() allocated_for_reference_type: string;
  @ApiProperty() allocated_for_reference_id: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryAllocationResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryAllocationResponseDto] })
  data: InventoryAllocationResponseDto[];
}

export class CreateAllocationDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() quantity_allocated: number;
  @ApiProperty() uom_id: string;
  @ApiProperty() allocation_type: string;
  @ApiProperty() allocated_for_reference_type: string;
  @ApiProperty() allocated_for_reference_id: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() item_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() notes?: string;
}

// ─── Allocation Rules ──────────────────────────────────────

export class AllocationRuleResponseDto {
  @ApiProperty() rule_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() rule_code: string;
  @ApiProperty() rule_name: string;
  @ApiPropertyOptional() rule_description?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() product_category_id?: string;
  @ApiProperty() allocation_strategy: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() respect_lot_control?: boolean;
  @ApiPropertyOptional() respect_expiry_dates?: boolean;
  @ApiPropertyOptional() min_shelf_life_days?: number;
  @ApiPropertyOptional() prefer_full_pallets?: boolean;
  @ApiPropertyOptional() prefer_single_location?: boolean;
  @ApiPropertyOptional() max_locations_per_order?: number;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() effective_from?: Date;
  @ApiPropertyOptional() effective_to?: Date;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedAllocationRuleResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [AllocationRuleResponseDto] })
  data: AllocationRuleResponseDto[];
}

export class CreateAllocationRuleDto {
  @ApiProperty() rule_code: string;
  @ApiProperty() rule_name: string;
  @ApiProperty() allocation_strategy: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() rule_description?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() product_category_id?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() respect_lot_control?: boolean;
  @ApiPropertyOptional() respect_expiry_dates?: boolean;
  @ApiPropertyOptional() min_shelf_life_days?: number;
  @ApiPropertyOptional() prefer_full_pallets?: boolean;
  @ApiPropertyOptional() prefer_single_location?: boolean;
  @ApiPropertyOptional() max_locations_per_order?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() effective_from?: Date;
  @ApiPropertyOptional() effective_to?: Date;
}

export class UpdateAllocationRuleDto {
  @ApiPropertyOptional() rule_code?: string;
  @ApiPropertyOptional() rule_name?: string;
  @ApiPropertyOptional() allocation_strategy?: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() rule_description?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() product_category_id?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() respect_lot_control?: boolean;
  @ApiPropertyOptional() respect_expiry_dates?: boolean;
  @ApiPropertyOptional() min_shelf_life_days?: number;
  @ApiPropertyOptional() prefer_full_pallets?: boolean;
  @ApiPropertyOptional() prefer_single_location?: boolean;
  @ApiPropertyOptional() max_locations_per_order?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() effective_from?: Date;
  @ApiPropertyOptional() effective_to?: Date;
}

// ─── Inventory Holds ───────────────────────────────────────

export class InventoryHoldResponseDto {
  @ApiProperty() hold_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() lpn_id?: string;
  @ApiPropertyOptional() inventory_item_id?: string;
  @ApiProperty() hold_reason: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() hold_reason_code?: string;
  @ApiPropertyOptional() hold_reason_description?: string;
  @ApiProperty() placed_by_user_id: string;
  @ApiProperty() placed_at: Date;
  @ApiPropertyOptional() released_by_user_id?: string;
  @ApiPropertyOptional() released_at?: Date;
  @ApiPropertyOptional() release_notes?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryHoldResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryHoldResponseDto] })
  data: InventoryHoldResponseDto[];
}

export class CreateHoldDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() hold_reason: string;
  @ApiPropertyOptional() lpn_id?: string;
  @ApiPropertyOptional() inventory_item_id?: string;
  @ApiPropertyOptional() hold_reason_code?: string;
  @ApiPropertyOptional() hold_reason_description?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateHoldDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() lpn_id?: string;
  @ApiPropertyOptional() inventory_item_id?: string;
  @ApiPropertyOptional() hold_reason_code?: string;
  @ApiPropertyOptional() hold_reason_description?: string;
  @ApiPropertyOptional() notes?: string;
}

export class ReleaseHoldDto {
  @ApiPropertyOptional() reason?: string;
  @ApiPropertyOptional() supervisor_pin_override?: string;
}

// ─── Classification ────────────────────────────────────────

export class ClassificationResponseDto {
  @ApiProperty() classification_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() product_sku: string;
  @ApiPropertyOptional() analysis_start_date?: Date;
  @ApiPropertyOptional() analysis_end_date?: Date;
  @ApiPropertyOptional() analysis_period_days?: number;
  @ApiPropertyOptional() total_orders?: number;
  @ApiPropertyOptional() total_quantity_shipped?: number;
  @ApiPropertyOptional() average_daily_quantity?: number;
  @ApiProperty() abc_class: string;
  @ApiPropertyOptional() velocity_score?: number;
  @ApiPropertyOptional() velocity_rank?: number;
  @ApiPropertyOptional() movement_type?: string;
  @ApiPropertyOptional() pick_frequency?: number;
  @ApiPropertyOptional() recommended_zone_type?: string;
  @ApiPropertyOptional() recommended_location_type?: string;
  @ApiPropertyOptional() calculated_at?: Date;
  @ApiPropertyOptional() next_calculation_due?: Date;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class UpdateClassificationDto {
  @ApiProperty() abc_class: string;
}

// ─── Approval Requests ─────────────────────────────────────

export class AdjustmentApprovalResponseDto {
  @ApiProperty() request_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() count_id: string;
  @ApiPropertyOptional() count_number?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_sku?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() location_code?: string;
  @ApiPropertyOptional() system_quantity?: number;
  @ApiPropertyOptional() counted_quantity?: number;
  @ApiPropertyOptional() variance_quantity?: number;
  @ApiPropertyOptional() variance_percentage?: number;
  @ApiPropertyOptional() variance_value?: number;
  @ApiPropertyOptional() approval_level?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() requested_by?: string;
  @ApiPropertyOptional() requested_by_name?: string;
  @ApiProperty() requested_at: Date;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() assigned_to_name?: string;
  @ApiPropertyOptional() assigned_at?: Date;
  @ApiPropertyOptional() reviewed_by?: string;
  @ApiPropertyOptional() reviewed_by_name?: string;
  @ApiPropertyOptional() reviewed_at?: Date;
  @ApiPropertyOptional() approval_comments?: string;
  @ApiPropertyOptional() rejection_reason?: string;
  @ApiPropertyOptional() days_pending?: number;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedAdjustmentApprovalResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [AdjustmentApprovalResponseDto] })
  data: AdjustmentApprovalResponseDto[];
}

export class RejectApprovalDto {
  @ApiPropertyOptional() reason?: string;
}

// ─── Approval Threshold Config ─────────────────────────────

export class ApprovalThresholdConfigResponseDto {
  @ApiPropertyOptional() config_id?: string;
  @ApiPropertyOptional() tenant_id?: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() threshold_type?: string;
  @ApiPropertyOptional() auto_approve_pct?: number;
  @ApiPropertyOptional() auto_approve_abs?: number;
  @ApiPropertyOptional() supervisor_review_pct?: number;
  @ApiPropertyOptional() recount_pct?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class UpsertThresholdDto {
  @ApiPropertyOptional() version?: string;
  @ApiPropertyOptional() auto_threshold?: number;
  @ApiPropertyOptional() supervisor_threshold?: number;
  @ApiPropertyOptional() manager_threshold?: number;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() threshold_type?: string;
  @ApiPropertyOptional() auto_approve_pct?: number;
  @ApiPropertyOptional() auto_approve_abs?: number;
  @ApiPropertyOptional() supervisor_review_pct?: number;
  @ApiPropertyOptional() recount_pct?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── On-Hand ───────────────────────────────────────────────

export class InventoryOnHandResponseDto {
  @ApiProperty() on_hand_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() lpn_code?: string;
  @ApiProperty() quantity_on_hand: number;
  @ApiProperty() quantity_allocated: number;
  @ApiProperty() quantity_reserved: number;
  @ApiProperty() quantity_picked: number;
  @ApiProperty() quantity_on_hold: number;
  @ApiProperty() quantity_damaged: number;
  @ApiPropertyOptional() inbound_qty: number;
  @ApiPropertyOptional() status?: string;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() uom_name?: string;
  @ApiPropertyOptional() owner_client_id?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class PaginatedInventoryOnHandResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryOnHandResponseDto] })
  data: InventoryOnHandResponseDto[];
}

// ─── Aging Report ──────────────────────────────────────────

export class AgingReportItemDto {
  @ApiProperty() on_hand_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() received_date?: Date;
  @ApiPropertyOptional() expiry_date?: Date;
  @ApiProperty() quantity_on_hand: number;
  @ApiPropertyOptional() days_in_warehouse?: number;
}

export class AgingSummaryItemDto {
  @ApiProperty() bucket: string;
  @ApiProperty() quantity: number;
}

// ─── Root Cause Categories ─────────────────────────────────

export class RootCauseCategoryResponseDto {
  @ApiProperty() category_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty() category_type: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() version?: number;
}

export class CreateRootCauseCategoryDto {
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty() category_type: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class AssignRootCauseDto {
  @ApiProperty() investigation_id: string;
  @ApiPropertyOptional() description?: string;
}

// ─── Count Scheduler ───────────────────────────────────────

export class CountSchedulerMetricsResponseDto {
  @ApiProperty() metric_id: string;
  @ApiPropertyOptional() schedule_run_at?: Date;
  @ApiPropertyOptional() total_counts_created?: number;
  @ApiPropertyOptional() a_items_created?: number;
  @ApiPropertyOptional() b_items_created?: number;
  @ApiPropertyOptional() c_items_created?: number;
  @ApiPropertyOptional() errors_count?: number;
}

export class GenerateScheduledCountsDto {
  @ApiProperty() facility_id: string;
}

export class ReclassifyAbcDto {
  @ApiProperty() facility_id: string;
}

export class SchedulerGenerateResponseDto {
  @ApiProperty() totalCountsCreated: number;
  @ApiProperty() aItems: number;
  @ApiProperty() bItems: number;
  @ApiProperty() cItems: number;
  @ApiProperty() errors: number;
}

export class ReclassifyAbcResponseDto {
  @ApiProperty() reclassified: number;
}

// ─── Cycle Count Events ────────────────────────────────────

export class CycleCountEventResponseDto {
  @ApiProperty() event_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() count_id: string;
  @ApiProperty() event_type: string;
  @ApiPropertyOptional() event_data?: string;
  @ApiPropertyOptional() performed_by?: string;
  @ApiProperty() performed_at: Date;
  @ApiPropertyOptional() snapshot?: string;
}

// ─── Scan / Verify Responses ───────────────────────────────

export class ScanLocationResponseDto {
  @ApiProperty() locationId: string;
  @ApiProperty() locationCode: string;
  @ApiPropertyOptional() barcodeValue?: string;
  @ApiProperty({ type: [Object] }) items: any[];
  @ApiProperty() itemCount: number;
  @ApiProperty() isBlindCount: boolean;
}

export class VerifyItemResponseDto {
  @ApiProperty() verified: boolean;
  @ApiProperty() matchType: string;
  @ApiProperty({ required: false }) lpn?: any;
  @ApiProperty({ required: false }) product?: any;
  @ApiProperty({ required: false }) onHandQty?: number;
}

export class LpnCountStartResponseDto {
  @ApiProperty() count: any;
  @ApiProperty({ type: [Object] }) items: any[];
  @ApiProperty() lpn: any;
}

export class ReplenishmentNextTaskResponseDto {
  @ApiProperty({ required: false }) taskId?: string;
  @ApiProperty({ required: false }) locationCode?: string;
  @ApiProperty({ required: false }) productCode?: string;
  @ApiProperty({ required: false }) quantityNeeded?: number;
}

export class FifoAllocationDto {
  @ApiProperty() lotId: string;
  @ApiPropertyOptional() lotNumber?: string;
  @ApiProperty() quantityAllocated: number;
  @ApiProperty() availableBefore: number;
  @ApiProperty() availableAfter: number;
}

// ─── RF Request DTOs ───────────────────────────────────────

export class RfPlaceHoldDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() hold_reason: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfReleaseHoldDto {
  @ApiPropertyOptional() reason?: string;
  @ApiPropertyOptional() supervisor_pin_override?: string;
}

export class RfInventoryTransferDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() from_location_id: string;
  @ApiProperty() to_location_id: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() uom_id?: string;
}

// ─── Inventory RF Response DTOs ───────────────────────────

export class RfInventoryTransferResponseDto {
  @ApiProperty() success: boolean;
}

export class RfLpnLookupDto {
  @ApiProperty() barcode: string;
}

export class RfLpnMoveDto {
  @ApiProperty() lpn_id: string;
  @ApiProperty() new_location_id: string;
}

export class RfCycleCountStartDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() count_scope_type?: string;
  @ApiPropertyOptional() count_scope_identifier?: string;
  @ApiPropertyOptional() count_type?: string;
  @ApiPropertyOptional() is_blind_count?: boolean;
  @ApiPropertyOptional() count_name?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfNextCountWorkDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfCycleCountScanLocationDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiProperty() location_barcode: string;
  @ApiProperty() count_id: string;
}

export class RfCycleCountScanLpnDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiProperty() location_barcode: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfStartLpnCountDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfEnterQtyDto {
  @ApiProperty() count_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() location_id: string;
  @ApiProperty() counted_quantity: number;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfCycleCountCompleteDto {
  @ApiProperty() count_id: string;
}

export class RfPendingReviewsDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfCycleCountRejectDto {
  @ApiPropertyOptional() reason?: string;
}

export class RfRootCauseDto {
  @ApiProperty() category_id: string;
  @ApiPropertyOptional() description?: string;
}

export class RfCreateAdHocDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() location_barcode?: string;
  @ApiPropertyOptional() lpn_barcode?: string;
  @ApiPropertyOptional() count_type?: string;
  @ApiPropertyOptional() notes?: string;
}

// Replenishment RF DTOs
export class RfReplenishmentNextDto {
  @ApiProperty() facility_id: string;
}

export class RfReplenishmentScanLocationDto {
  @ApiProperty() task_id: string;
  @ApiProperty() location_code: string;
}

export class RfReplenishmentScanProductDto {
  @ApiProperty() task_id: string;
  @ApiProperty() product_code: string;
}

export class RfReplenishmentConfirmDto {
  @ApiProperty() task_id: string;
}

// ─── Replenishment RF Response DTOs ───────────────────────

export class RfReplenishmentScanLocationResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfReplenishmentScanProductResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfReplenishmentConfirmResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}
