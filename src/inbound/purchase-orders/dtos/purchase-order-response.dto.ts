import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class PurchaseOrderLineDto {
  @ApiProperty() line_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() po_id: number;
  @ApiProperty() line_number: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() product_code: string | null;
  @ApiPropertyOptional() supplier_part_number: string | null;
  @ApiProperty() ordered_quantity: number;
  @ApiPropertyOptional() received_quantity: number | null;
  @ApiPropertyOptional() remaining_quantity: number | null;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() uom_name: string | null;
  @ApiPropertyOptional() unit_cost: number | null;
  @ApiPropertyOptional() line_total: number | null;
  @ApiPropertyOptional() required_date: string | null;
  @ApiPropertyOptional() promised_date: string | null;
  @ApiPropertyOptional() expected_receipt_date: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class PurchaseOrderDto {
  @ApiProperty() po_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() po_number: string;
  @ApiPropertyOptional() po_name: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() vendor_id: number;
  @ApiPropertyOptional() vendor_name: string | null;
  @ApiPropertyOptional() vendor_code: string | null;
  @ApiPropertyOptional() vendor_address_line1: string | null;
  @ApiPropertyOptional() vendor_address_line2: string | null;
  @ApiPropertyOptional() vendor_city: string | null;
  @ApiPropertyOptional() vendor_state_province: string | null;
  @ApiPropertyOptional() vendor_postal_code: string | null;
  @ApiPropertyOptional() vendor_country_code: string | null;
  @ApiPropertyOptional() vendor_contact_name: string | null;
  @ApiPropertyOptional() vendor_contact_phone: string | null;
  @ApiPropertyOptional() vendor_contact_email: string | null;
  @ApiProperty() order_date: string;
  @ApiPropertyOptional() required_date: string | null;
  @ApiPropertyOptional() promised_date: string | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() total_po_value: number | null;
  @ApiPropertyOptional() total_po_quantity: number | null;
  @ApiPropertyOptional() requested_by_user_id: string | null;
  @ApiPropertyOptional() approved_by_user_id: string | null;
  @ApiPropertyOptional() assigned_buyer_id: string | null;
  @ApiPropertyOptional() approved_date: string | null;
  @ApiPropertyOptional() confirmed_date: string | null;
  @ApiPropertyOptional() expected_receipt_date: string | null;
  @ApiPropertyOptional() fully_received_date: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class PurchaseOrderDetailDto extends PurchaseOrderDto {
  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  lines: PurchaseOrderLineDto[] | null;
}

export class PoListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PurchaseOrderDto] })
  data: PurchaseOrderDto[];
}

export class RfLookupResultDto {
  @ApiProperty({ type: [PurchaseOrderDto] })
  data: PurchaseOrderDto[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  limit: number;
  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  lines: PurchaseOrderLineDto[] | null;
}

export class RfStartReceivingResultDto {
  @ApiPropertyOptional({ type: PurchaseOrderDto })
  po: PurchaseOrderDto | null;
  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  lines: PurchaseOrderLineDto[] | null;
  @ApiProperty()
  message: string;
}

export class CreatePurchaseOrderLineDto {
  @ApiProperty() line_number: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string;
  @ApiPropertyOptional() product_code: string;
  @ApiPropertyOptional() supplier_part_number: string;
  @ApiProperty() ordered_quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() unit_cost: number;
  @ApiPropertyOptional() required_date: string;
  @ApiPropertyOptional() promised_date: string;
  @ApiPropertyOptional() expected_receipt_date: string;
  @ApiPropertyOptional() notes: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() po_number: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() po_name: string;
  @ApiPropertyOptional() description: string;
  @ApiProperty() vendor_id: number;
  @ApiPropertyOptional() order_date: string;
  @ApiPropertyOptional() required_date: string;
  @ApiPropertyOptional() promised_date: string;
  @ApiPropertyOptional() expected_receipt_date: string;
  @ApiPropertyOptional() currency_code: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() requested_by_user_id: string;
  @ApiPropertyOptional() assigned_buyer_id: string;
  @ApiPropertyOptional({ type: [CreatePurchaseOrderLineDto] })
  lines: CreatePurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional() po_name: string;
  @ApiPropertyOptional() description: string;
  @ApiPropertyOptional() required_date: string;
  @ApiPropertyOptional() promised_date: string;
  @ApiPropertyOptional() expected_receipt_date: string;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional() assigned_buyer_id: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class StartReceivingDto {
  @ApiProperty() po_number: string;
  @ApiPropertyOptional() facility_id?: string;
}
