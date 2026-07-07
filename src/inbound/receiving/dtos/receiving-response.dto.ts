import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class DamageCodeResponseDto {
  @ApiProperty() damage_code_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty() category: string;
  @ApiPropertyOptional() requires_qc: boolean | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class ReceivingToleranceConfigResponseDto {
  @ApiProperty() config_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() product_id: number | null;
  @ApiPropertyOptional() vendor_id: number | null;
  @ApiProperty() tolerance_type: string;
  @ApiPropertyOptional() over_tolerance: number | null;
  @ApiPropertyOptional() under_tolerance: number | null;
  @ApiPropertyOptional() requires_supervisor_approval: boolean | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class GoodsReceiptLineResponseDto {
  @ApiProperty() receipt_line_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiProperty() receipt_id: number;
  @ApiProperty() product_id: number;
  @ApiProperty() expected_quantity: number;
  @ApiProperty() received_quantity: number;
  @ApiProperty() damaged_quantity: number;
  @ApiPropertyOptional() short_quantity: number | null;
  @ApiPropertyOptional() over_quantity: number | null;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() uom_name: string | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiPropertyOptional() serial_numbers_json: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
  @ApiPropertyOptional() expiry_date: string | null;
  @ApiPropertyOptional() qc_result: string | null;
  @ApiPropertyOptional() qc_failure_reason: string | null;
  @ApiPropertyOptional() qc_inspected_quantity: number | null;
  @ApiPropertyOptional() qc_passed_quantity: number | null;
  @ApiPropertyOptional() qc_failed_quantity: number | null;
  @ApiPropertyOptional() disposition_action: string | null;
  @ApiPropertyOptional() rejected_quantity: number | null;
  @ApiProperty() line_status: string;
  @ApiProperty() variance_type: string;
  @ApiProperty() qc_status: string;
  @ApiPropertyOptional() qc_inspector_id: number | null;
  @ApiPropertyOptional() qc_inspected_at: string | null;
  @ApiPropertyOptional() asn_line_id: number | null;
}

export class GoodsReceiptResponseDto {
  @ApiProperty() receipt_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() receipt_number: string;
  @ApiPropertyOptional() receipt_name: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() po_number: string | null;
  @ApiPropertyOptional() asn_number: string | null;
  @ApiPropertyOptional() vendor_id: number | null;
  @ApiPropertyOptional() vendor_name: string | null;
  @ApiPropertyOptional() expected_date: string | null;
  @ApiPropertyOptional() received_date: string | null;
  @ApiPropertyOptional() total_weight: number | null;
  @ApiPropertyOptional() total_volume: number | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() inbound_for_client_id: number | null;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() qc_required: boolean | null;
  @ApiPropertyOptional() qc_result: string | null;
  @ApiPropertyOptional() qc_failure_reason: string | null;
  @ApiPropertyOptional() qc_completed_at: string | null;
  @ApiPropertyOptional() qc_completed_by_user_id: number | null;
  @ApiPropertyOptional() qc_status_summary: string | null;
  @ApiPropertyOptional() status_changed_at: string | null;
  @ApiPropertyOptional() status_changed_by: number | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class GoodsReceiptItemDto {
  @ApiProperty() receipt_item_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() receipt_line_id: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiProperty() quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() uom_name: string | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiPropertyOptional() serial_numbers_json: string | null;
  @ApiProperty() condition_status: string;
  @ApiPropertyOptional() temporary_location_id: number | null;
  @ApiPropertyOptional() location_name: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class GoodsReceiptWithLinesResponseDto extends GoodsReceiptResponseDto {
  @ApiPropertyOptional({ type: [GoodsReceiptLineResponseDto] })
  lines: GoodsReceiptLineResponseDto[] | null;
  @ApiPropertyOptional({ type: [GoodsReceiptItemDto] })
  items: GoodsReceiptItemDto[] | null;
}

export class PaginatedGoodsReceiptResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [GoodsReceiptResponseDto] })
  data: GoodsReceiptResponseDto[];
}

export class ReceiveLineResponseDto {
  @ApiPropertyOptional() line: any;
  @ApiProperty() variance_type: string;
  @ApiProperty() good_qty: number;
  @ApiProperty() damaged_qty: number;
}

export class ToleranceCheckResponseDto {
  @ApiProperty() within: boolean;
  @ApiProperty() variance: string;
  @ApiPropertyOptional() requires_supervisor: boolean | null;
}

export class AssignDockDoorResponseDto {
  @ApiProperty() dock_id: string;
  @ApiProperty() dock_code: string;
  @ApiProperty() dock_name: string;
  @ApiPropertyOptional() appointment_id: string | null;
}

export class ScanProductResponseDto {
  @ApiProperty() product: any;
  @ApiPropertyOptional() open_line: any;
  @ApiProperty() already_received: number;
  @ApiProperty() expected_total: number;
}

export class LookupAsnResponseDto {
  @ApiProperty() asn: any;
  @ApiProperty({ type: [Object] })
  lines: any[];
}

export class LookupPoResponseDto {
  @ApiProperty() po: any;
  @ApiProperty({ type: [Object] })
  lines: any[];
}

export class LookupLpnResponseDto {
  @ApiPropertyOptional() lpn: any;
  @ApiPropertyOptional() task: any;
  @ApiPropertyOptional() product: any;
  @ApiPropertyOptional() from_location_id: any;
}

export class SeedResponseDto {
  @ApiProperty() seeded: number;
}

export class DeleteResultDto {
  @ApiProperty({ description: 'Number of records affected' })
  count: number;
}

export class CreateDamageCodeDto {
  @ApiProperty() damage_code: string;
  @ApiPropertyOptional() damage_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() severity: string;
  @ApiPropertyOptional() requires_qc: boolean;
  @ApiPropertyOptional() is_active: boolean;
}

export class UpdateDamageCodeDto {
  @ApiPropertyOptional() damage_code: string;
  @ApiPropertyOptional() damage_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() severity: string;
  @ApiPropertyOptional() requires_qc: boolean;
  @ApiPropertyOptional() is_active: boolean;
}

export class CreateReceivingToleranceDto {
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() product_id: number;
  @ApiPropertyOptional() vendor_id: number;
  @ApiPropertyOptional() tolerance_type: string;
  @ApiPropertyOptional() min_tolerance: number;
  @ApiPropertyOptional() max_tolerance: number;
  @ApiPropertyOptional() requires_supervisor_approval: boolean;
  @ApiPropertyOptional() is_active: boolean;
}

export class CreateGoodsReceiptDto {
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() receipt_number: string;
  @ApiPropertyOptional() receipt_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() po_number: string;
  @ApiPropertyOptional() asn_number: string;
  @ApiPropertyOptional() vendor_id: number;
  @ApiPropertyOptional() expected_date: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() inbound_for_client_id: number;
}

export class ReceiveLineDto {
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() expected_quantity: number;
  @ApiProperty() received_quantity: number;
  @ApiPropertyOptional() damaged_quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() lot_number: string;
  @ApiPropertyOptional() serial_numbers_json: string;
  @ApiPropertyOptional() expiry_date: string;
  @ApiPropertyOptional() asn_line_id: number;
  @ApiPropertyOptional() po_line_id: number;
  @ApiPropertyOptional() staging_location_id: number;
  @ApiPropertyOptional() disposition_action: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() created_by: string;
}

export class ApproveVarianceDto {
  @ApiPropertyOptional() approved_by: string;
  @ApiPropertyOptional() notes: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfAssignDoorDto {
  @ApiProperty() dock_code: string;
  @ApiPropertyOptional() appointment_id: string;
  @ApiPropertyOptional() facility_id: string;
}

export class RfStartReceivingSessionDto {
  @ApiPropertyOptional() receipt_id: string;
  @ApiPropertyOptional() asn_number: string;
  @ApiPropertyOptional() po_number: string;
  @ApiPropertyOptional() facility_id: string;
}

export class RfScanProductDto {
  @ApiProperty() receipt_id: string;
  @ApiPropertyOptional() product_id: string;
  @ApiPropertyOptional() barcode: string;
  @ApiPropertyOptional() facility_id: string;
}

export class RfScanAsnDto {
  @ApiProperty() asn_number: string;
  @ApiProperty() facility_id: string;
}

export class RfScanPoDto {
  @ApiProperty() po_number: string;
  @ApiProperty() facility_id: string;
}

export class RfScanLpnReceiveDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() lpn_barcode: string;
}

export class RfBlindReceiveDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() product_id: string;
  @ApiPropertyOptional() barcode: string;
  @ApiPropertyOptional() quantity: number;
  @ApiPropertyOptional() uom_id: string;
}

export class RfConfirmReceiveDto {
  @ApiProperty() receipt_id: string;
  @ApiPropertyOptional() receipt_line_id: string;
  @ApiPropertyOptional() received_quantity: number;
  @ApiPropertyOptional() damaged_quantity: number;
  @ApiPropertyOptional() lot_number: string;
  @ApiPropertyOptional() serial_numbers_json: string;
  @ApiPropertyOptional() expiry_date: string;
  @ApiPropertyOptional() staging_location_id: string;
  @ApiPropertyOptional() disposition_action: string;
  @ApiPropertyOptional() notes: string;
}

export class RfStageReceiptDto {
  @ApiProperty() receipt_id: string;
  @ApiProperty() staging_location_id: string;
}

export class RfCompleteReceiptDto {
  @ApiProperty() receipt_id: string;
  @ApiPropertyOptional() staging_location_id: string;
}

export class RfPendingApprovalsDto {
  @ApiPropertyOptional() facility_id: string;
}

export class RfApproveVarianceDto {
  @ApiPropertyOptional() config_id: string;
  @ApiPropertyOptional() action: string;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfDamageCodeListResponseDto {
  @ApiProperty({ type: [DamageCodeResponseDto] })
  damage_codes: DamageCodeResponseDto[];
  @ApiProperty()
  message: string;
  @ApiProperty()
  tenant_id: string;
}

export class RfPendingApprovalsResponseDto {
  @ApiProperty({ type: [Object] })
  pending_approvals: any[];
  @ApiProperty()
  facility_id: string;
  @ApiProperty()
  message: string;
}

export class RfApproveVarianceResponseDto {
  @ApiProperty()
  approved: boolean;
  @ApiProperty()
  config_id: string;
  @ApiProperty()
  action: string;
}
