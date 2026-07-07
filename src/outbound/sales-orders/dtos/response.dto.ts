import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class SalesOrderDto {
  @ApiProperty() order_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() order_number: string;
  @ApiPropertyOptional() order_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() order_type?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() client_name?: string;
  @ApiPropertyOptional() client_code?: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() customer_id?: string;
  @ApiPropertyOptional() customer_name?: string;
  @ApiPropertyOptional() order_date?: Date;
  @ApiPropertyOptional() requested_delivery_date?: Date;
  @ApiPropertyOptional() promised_delivery_date?: Date;
  @ApiPropertyOptional() delivery_address_line1?: string;
  @ApiPropertyOptional() delivery_address_line2?: string;
  @ApiPropertyOptional() delivery_city?: string;
  @ApiPropertyOptional() delivery_state_province?: string;
  @ApiPropertyOptional() delivery_postal_code?: string;
  @ApiPropertyOptional() delivery_country_code?: string;
  @ApiPropertyOptional() delivery_contact_name?: string;
  @ApiPropertyOptional() delivery_contact_phone?: string;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() total_order_quantity?: number;
  @ApiPropertyOptional() total_order_value?: number;
  @ApiPropertyOptional() assigned_sales_rep_id?: string;
  @ApiPropertyOptional() assigned_warehouse_user_id?: string;
  @ApiPropertyOptional() confirmed_date?: Date;
  @ApiPropertyOptional() shipped_date?: Date;
  @ApiPropertyOptional() delivered_date?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class SalesOrderPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [SalesOrderDto] })
  data: SalesOrderDto[];
}

export class SalesOrderDetailDto extends SalesOrderDto {
  @ApiPropertyOptional({ type: [Object] }) lines?: any[];
}

export class OrderLineDto {
  @ApiProperty() line_id: string;
  @ApiProperty() order_id: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiProperty() line_number: number;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_code?: string;
  @ApiProperty() requested_quantity: number;
  @ApiPropertyOptional() fulfilled_quantity?: number;
  @ApiPropertyOptional() remaining_quantity?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() unit_price?: number;
  @ApiPropertyOptional() line_total?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() promised_delivery_date?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class ValidationResultDto {
  @ApiProperty() orderId: string;
  @ApiProperty() orderNumber: string;
  @ApiProperty() valid: boolean;
  @ApiProperty({ type: [String] }) errors: string[];
}

export class RecalcResultDto {
  @ApiProperty() totalOrderQuantity: number;
  @ApiProperty() totalOrderValue: number;
}

export class CreateSalesOrderDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() order_number: string;
  @ApiPropertyOptional() order_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() order_date?: Date;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() client_name?: string;
  @ApiPropertyOptional() client_code?: string;
  @ApiPropertyOptional() customer_id?: string;
  @ApiPropertyOptional() order_type?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() requested_delivery_date?: Date;
  @ApiPropertyOptional() promised_delivery_date?: Date;
  @ApiPropertyOptional() delivery_address_line1?: string;
  @ApiPropertyOptional() delivery_address_line2?: string;
  @ApiPropertyOptional() delivery_city?: string;
  @ApiPropertyOptional() delivery_state_province?: string;
  @ApiPropertyOptional() delivery_postal_code?: string;
  @ApiPropertyOptional() delivery_country_code?: string;
  @ApiPropertyOptional() delivery_contact_name?: string;
  @ApiPropertyOptional() delivery_contact_phone?: string;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() assigned_sales_rep_id?: string;
  @ApiPropertyOptional() assigned_warehouse_user_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional({ type: [Object] }) lines?: any[];
}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional() order_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() requested_delivery_date?: Date;
  @ApiPropertyOptional() promised_delivery_date?: Date;
  @ApiPropertyOptional() delivery_address_line1?: string;
  @ApiPropertyOptional() delivery_address_line2?: string;
  @ApiPropertyOptional() delivery_city?: string;
  @ApiPropertyOptional() delivery_state_province?: string;
  @ApiPropertyOptional() delivery_postal_code?: string;
  @ApiPropertyOptional() delivery_country_code?: string;
  @ApiPropertyOptional() delivery_contact_name?: string;
  @ApiPropertyOptional() delivery_contact_phone?: string;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() client_name?: string;
  @ApiPropertyOptional() client_code?: string;
  @ApiPropertyOptional() assigned_sales_rep_id?: string;
  @ApiPropertyOptional() assigned_warehouse_user_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class CreateOrderLineDto {
  @ApiProperty() product_id: string;
  @ApiProperty() requested_quantity: number;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() product_code?: string;
  @ApiPropertyOptional() unit_price?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() promised_delivery_date?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class CreateBackorderRecordDto {
  @ApiProperty() order_line_id: string;
  @ApiProperty() shortfall_qty: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() fulfilled_qty?: number;
}

export class UpdateBackorderRecordDto {
  @ApiPropertyOptional() shortfall_qty?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() fulfilled_qty?: number;
}

// ─── Cartonization Preference DTOs ────────────────────────

export class CartonizationPreferenceDto {
  @ApiProperty() preference_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() customer_id: string;
  @ApiPropertyOptional() preferred_carton_type?: string;
  @ApiPropertyOptional() max_cartons_per_shipment?: number;
  @ApiPropertyOptional() combine_items?: boolean;
  @ApiPropertyOptional() signature_required_cartons?: boolean;
  @ApiPropertyOptional() gift_wrap_cartons?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class CartonizationPreferencePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [CartonizationPreferenceDto] })
  data: CartonizationPreferenceDto[];
}

export class CreateCartonizationPreferenceDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() customer_id: string;
  @ApiPropertyOptional() preferred_carton_type?: string;
  @ApiPropertyOptional() max_cartons_per_shipment?: number;
  @ApiPropertyOptional() combine_items?: boolean;
  @ApiPropertyOptional() signature_required_cartons?: boolean;
  @ApiPropertyOptional() gift_wrap_cartons?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateCartonizationPreferenceDto {
  @ApiPropertyOptional() preferred_carton_type?: string;
  @ApiPropertyOptional() max_cartons_per_shipment?: number;
  @ApiPropertyOptional() combine_items?: boolean;
  @ApiPropertyOptional() signature_required_cartons?: boolean;
  @ApiPropertyOptional() gift_wrap_cartons?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
}
