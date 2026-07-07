import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class PackingSessionDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() session_number: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() station_id?: string;
  @ApiPropertyOptional() station_code?: string;
  @ApiPropertyOptional() station_name?: string;
  @ApiPropertyOptional() current_order_id?: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiPropertyOptional() orders_completed?: number;
  @ApiPropertyOptional() cartons_completed?: number;
  @ApiPropertyOptional() completed_cartons?: number;
  @ApiPropertyOptional() items_packed?: number;
  @ApiPropertyOptional() planned_cartons?: number;
  @ApiPropertyOptional() errors_count?: number;
  @ApiPropertyOptional() exceptions_count?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() start_time: Date;
  @ApiPropertyOptional() end_time?: Date;
  @ApiPropertyOptional() last_activity_time?: Date;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() modified_by?: string;
  @ApiProperty() created_date: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class PackSlipDto {
  @ApiProperty() packing_slip_id: string;
  @ApiProperty() packing_slip_number: string;
  @ApiPropertyOptional() packing_slip_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() order_id: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() session_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() packed_by_user_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() created_date: Date;
  @ApiPropertyOptional() packed_date?: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class CloseCartonResultDto {
  @ApiProperty() lpnId: string;
  @ApiProperty() lpnNumber: string;
  @ApiProperty() labelData: string;
  @ApiProperty() orderId: string;
  @ApiProperty() cartonIndex: number;
  @ApiProperty() totalCartons: number;
  @ApiProperty() allCartonsPacked: boolean;
}

export class PackingExceptionDto {
  @ApiProperty() exception_id: string;
  @ApiProperty() exception_type: string;
  @ApiProperty() status: string;
  @ApiProperty() reason_code: string;
  @ApiProperty() created_at: Date;
}

export class PackingSessionFullDto extends PackingSessionDto {
  @ApiPropertyOptional({ type: [PackSlipDto] }) packingSlips?: PackSlipDto[];
  @ApiPropertyOptional() statusHistory?: any[];
}

export class PackingStationDto {
  @ApiProperty() station_id: string;
  @ApiProperty() station_code: string;
  @ApiProperty() is_available: boolean;
  @ApiProperty() is_active: boolean;
}

export class CartonizationResultDto {
  @ApiProperty({ type: [Object] }) cartons: any[];
}

export class ShipmentPackingStatusDto {
  @ApiProperty() shipmentId: string;
  @ApiProperty() shipmentNumber: string;
  @ApiProperty() status: string;
  @ApiProperty() totalCartons: number;
  @ApiProperty() packedCartons: number;
  @ApiProperty() pendingCartons: number;
  @ApiProperty({ type: [Object] }) cartons: any[];
}

export class StartPackingSessionDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() session_number?: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() station_id?: string;
  @ApiPropertyOptional() station_code?: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class PackItemDto {
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() packing_slip_number?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional({ type: [Object] }) items?: any[];
  @ApiPropertyOptional({ type: [String] }) pick_lpn_ids?: string[];
  @ApiPropertyOptional() carton_lpn_id?: string;
  @ApiPropertyOptional() container_code?: string;
  @ApiPropertyOptional() container_type?: string;
  @ApiPropertyOptional() container_id?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() serial_numbers?: any[];
  @ApiPropertyOptional() notes?: string;
}

export class CreateCartonizationRuleDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() rule_name: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() conditions_json?: any;
  @ApiPropertyOptional() carton_type_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateCartonizationRuleDto {
  @ApiPropertyOptional() rule_name?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() conditions_json?: any;
  @ApiPropertyOptional() carton_type_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreateCartonPlanDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() order_id: string;
  @ApiProperty() carton_index: number;
  @ApiProperty() total_cartons: number;
  @ApiPropertyOptional() carton_type_id?: string;
  @ApiPropertyOptional() items_json?: any;
  @ApiPropertyOptional() status?: string;
}

export class CreatePackingContainerDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() container_code: string;
  @ApiProperty() container_type: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight_tare?: number;
  @ApiPropertyOptional() max_weight_capacity?: number;
  @ApiPropertyOptional() max_volume_capacity?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() current_location_id?: string;
  @ApiPropertyOptional() packing_slip_id?: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() carton_index?: number;
  @ApiPropertyOptional() total_cartons?: number;
}

export class CreatePackingDamageCodeDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class CreatePackingStationDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() station_name: string;
  @ApiProperty() station_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() printer_type?: string;
  @ApiPropertyOptional() scale_type?: string;
  @ApiPropertyOptional() scanner_type?: string;
  @ApiPropertyOptional() scale_device_id?: string;
  @ApiPropertyOptional() scale_device_type?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_available?: boolean;
}

export class UpdatePackingStationDto {
  @ApiPropertyOptional() station_name?: string;
  @ApiPropertyOptional() station_code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() printer_type?: string;
  @ApiPropertyOptional() scale_type?: string;
  @ApiPropertyOptional() scanner_type?: string;
  @ApiPropertyOptional() scale_device_id?: string;
  @ApiPropertyOptional() scale_device_type?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_available?: boolean;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfStartPackingDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() station_id?: string;
  @ApiPropertyOptional() order_id?: string;
}

export class RfScanOrderDto {
  @ApiProperty() session_id: string;
  @ApiProperty() order_id: string;
}

export class RfScanPackingItemDto {
  @ApiProperty() product_code: string;
  @ApiProperty() order_id: string;
}

export class RfPackItemsDto {
  @ApiProperty() session_id: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() packing_slip_number?: string;
  @ApiPropertyOptional() container_code?: string;
  @ApiPropertyOptional() container_type?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() items?: any[];
}

export class RfSealContainerDto {
  @ApiProperty() container_id: string;
  @ApiProperty() seal_number: string;
}

export class RfCloseCartonDto {
  @ApiProperty() session_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() container_type?: string;
  @ApiPropertyOptional() weight?: number;
}

export class RfCompletePackingDto {
  @ApiProperty() session_id: string;
}

export class RfMyPackingSessionDto {
  @ApiProperty() user_id: string;
}

export class RfGetNextPackWorkDto {
  @ApiProperty() station_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiPropertyOptional() session_id?: string;
}

export class RfNestPickLpnDto {
  @ApiProperty() carton_lpn_id: string;
  @ApiProperty() pick_lpn_id: string;
}

export class RfReportPackingShortageDto {
  @ApiProperty() session_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfReportPackingDamageDto {
  @ApiProperty() session_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() damage_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfPendingExceptionsDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfApproveExceptionDto {
  @ApiPropertyOptional() supervisor_id?: string;
}

export class RfRejectExceptionDto {
  @ApiPropertyOptional() supervisor_id?: string;
}

export class RfVerifyCartonDto {
  @ApiProperty() carton_lpn_id: string;
  @ApiProperty() order_id: string;
}

export class RfConfirmWeightDto {
  @ApiProperty() order_id: string;
  @ApiProperty() weight_kg: number;
  @ApiPropertyOptional() tolerance_pct?: number;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfPrintPackingSlipDto {
  @ApiProperty() slip_id: string;
}

export class RfDamageCodesDto {}

export class RfValidateToteDto {
  @ApiProperty() pick_lpn_id: string;
  @ApiProperty() session_id: string;
}

export class RfRequestCartonOverrideDto {
  @ApiProperty() session_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() carton_type?: string;
  @ApiPropertyOptional() reason_code?: string;
}

export class RfReportWrongItemDto {
  @ApiProperty() session_id: string;
  @ApiProperty() order_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() pick_task_id: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfRequestTrackingNumberDto {
  @ApiProperty() shipment_id: string;
  @ApiPropertyOptional() carrier_id?: string;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfStartPackingResponseDto {
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() session_number?: string;
}

export class RfScanOrderResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional({ type: Object }) session?: any;
  @ApiProperty() orderVerified: boolean;
}

export class RfScanPackingItemResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional({ type: Object }) product?: any;
  @ApiPropertyOptional() productVerified?: boolean;
  @ApiPropertyOptional() message?: string;
}

export class RfPackItemsResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfSealContainerResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfCloseCartonResponseDto {
  @ApiPropertyOptional() lpnId?: string;
  @ApiPropertyOptional() lpnNumber?: string;
  @ApiPropertyOptional() labelData?: string;
}

export class RfCompletePackingResponseDto {
  @ApiPropertyOptional({ type: Object }) session?: any;
}

export class RfMyPackingSessionResponseDto {
  @ApiPropertyOptional({ type: Object }) session?: any;
}

export class RfGetNextPackWorkResponseDto {
  @ApiPropertyOptional({ type: Object }) order?: any;
  @ApiPropertyOptional({ type: [Object] }) pickLpns?: any[];
  @ApiPropertyOptional({ type: Object }) cartonPlan?: any;
}

export class RfNestPickLpnResponseDto {
  @ApiProperty() cartonLpnId: string;
  @ApiProperty() pickLpnId: string;
  @ApiProperty() status: string;
}

export class RfReportPackingShortageResponseDto {
  @ApiPropertyOptional({ type: Object }) exception?: any;
}

export class RfReportPackingDamageResponseDto {
  @ApiPropertyOptional({ type: Object }) exception?: any;
}

export class RfPendingExceptionsResponseDto {
  @ApiPropertyOptional({ type: [Object] }) exceptions?: any[];
}

export class RfApproveExceptionResponseDto {
  @ApiPropertyOptional({ type: Object }) exception?: any;
}

export class RfRejectExceptionResponseDto {
  @ApiPropertyOptional({ type: Object }) exception?: any;
}

export class RfVerifyCartonResponseDto {
  @ApiProperty() isComplete: boolean;
  @ApiPropertyOptional({ type: [Object] }) missing?: any[];
  @ApiPropertyOptional({ type: [Object] }) extra?: any[];
  @ApiPropertyOptional({ type: [Object] }) matched?: any[];
}

export class RfCaptureWeightResponseDto {
  @ApiProperty() weightKg: number;
  @ApiProperty() isStable: boolean;
  @ApiProperty() unit: string;
  @ApiProperty() timestamp: string;
}

export class RfConfirmWeightResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() isWithinTolerance?: boolean;
}

export class RfPrintPackingSlipResponseDto {
  @ApiPropertyOptional({ type: Object }) data?: any;
}

export class RfDamageCodesResponseDto {
  @ApiPropertyOptional({ type: [Object] }) codes?: any[];
}

export class RfValidateToteResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfRequestCartonOverrideResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfReportWrongItemResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfRequestTrackingNumberResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

// ─── Packing Material DTOs ────────────────────────────────

export class PackingMaterialDto {
  @ApiProperty() material_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() material_code: string;
  @ApiProperty() material_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() standard_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() compatible_products_json?: string;
  @ApiPropertyOptional() compatible_containers_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_deleted?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: string;
}

export class PackingMaterialPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PackingMaterialDto] })
  data: PackingMaterialDto[];
}

export class CreatePackingMaterialDto {
  @ApiProperty() material_code: string;
  @ApiProperty() material_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiProperty() uom_id: string;
  @ApiPropertyOptional() standard_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() compatible_products_json?: string;
  @ApiPropertyOptional() compatible_containers_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_deleted?: boolean;
}

export class UpdatePackingMaterialDto {
  @ApiPropertyOptional() material_code?: string;
  @ApiPropertyOptional() material_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() volume?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() standard_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() compatible_products_json?: string;
  @ApiPropertyOptional() compatible_containers_json?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_deleted?: boolean;
}

// ─── Packing Station Response DTO (full) ──────────────────

export class PackingStationResponseDto {
  @ApiProperty() station_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() station_name: string;
  @ApiProperty() station_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() printer_type?: string;
  @ApiPropertyOptional() scale_type?: string;
  @ApiPropertyOptional() scanner_type?: string;
  @ApiPropertyOptional() scale_device_id?: string;
  @ApiPropertyOptional() scale_device_type?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() is_available?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: string;
}

export class PackingStationPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PackingStationResponseDto] })
  data: PackingStationResponseDto[];
}

// ─── Web Packing Response DTOs ────────────────────────────

export class PackItemsResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class SealContainerResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class PackingSlipViewResponseDto {
  @ApiPropertyOptional({ type: [Object] }) packingSlips?: any[];
}

export class CartonizationRuleResponseDto {
  @ApiPropertyOptional() rule_id?: string;
  @ApiPropertyOptional() rule_name?: string;
  @ApiPropertyOptional() priority?: number;
}

export class CartonizationRuleUpdateResponseDto {
  @ApiPropertyOptional({ type: Object }) rule?: any;
}

export class PickingQualityReportResponseDto {
  @ApiPropertyOptional({ type: Object }) report?: any;
}
