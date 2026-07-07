import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class StorageRateMasterDto {
  @ApiProperty() rate_id: number;
  @ApiPropertyOptional() tenant_id: string | null;
  @ApiPropertyOptional() client_id: number | null;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() location_zone_type: string | null;
  @ApiProperty() unit_type: string;
  @ApiProperty() rate_per_unit: number;
  @ApiPropertyOptional() rate_currency: string | null;
  @ApiProperty() rate_calculation_method: string;
  @ApiPropertyOptional() minimum_charge_days: number | null;
  @ApiPropertyOptional() free_storage_days: number | null;
  @ApiPropertyOptional() effective_from: string | null;
  @ApiPropertyOptional() effective_to: string | null;
}

export class StorageClientRateDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() rate_master_id: string | null;
  @ApiPropertyOptional() client_id: string | null;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() rate_name: string | null;
  @ApiPropertyOptional() rate_per_unit: number | null;
  @ApiPropertyOptional() rate_currency: string | null;
  @ApiPropertyOptional() effective_from: string | null;
  @ApiPropertyOptional() effective_to: string | null;
}

export class BillingCycleDto {
  @ApiProperty() billing_cycle_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() cycle_number: string;
  @ApiPropertyOptional() cycle_name: string | null;
  @ApiProperty() client_id: number;
  @ApiPropertyOptional() client_name: string | null;
  @ApiProperty() cycle_start_date: string;
  @ApiProperty() cycle_end_date: string;
  @ApiProperty() billing_frequency: string;
  @ApiPropertyOptional() status: string | null;
  @ApiPropertyOptional() total_storage_charges: number | null;
  @ApiPropertyOptional() total_handling_charges: number | null;
  @ApiPropertyOptional() total_vas_charges: number | null;
  @ApiPropertyOptional() total_shipping_charges: number | null;
  @ApiPropertyOptional() total_other_charges: number | null;
  @ApiPropertyOptional() grand_total: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() storage_charge_count: number | null;
  @ApiPropertyOptional() handling_charge_count: number | null;
  @ApiPropertyOptional() vas_charge_count: number | null;
  @ApiPropertyOptional() shipping_charge_count: number | null;
  @ApiPropertyOptional() calculation_started_at: string | null;
  @ApiPropertyOptional() calculation_completed_at: string | null;
  @ApiPropertyOptional() approved_by: number | null;
  @ApiPropertyOptional() approved_at: string | null;
  @ApiPropertyOptional() approval_notes: string | null;
  @ApiPropertyOptional() invoice_id: number | null;
  @ApiPropertyOptional() invoice_generated_at: string | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
}

export class BillingCyclesResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [BillingCycleDto] })
  data: BillingCycleDto[];
}

export class StorageSnapshotDto {
  @ApiProperty() snapshot_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() cycle_id: number;
  @ApiPropertyOptional() cycle_name: string | null;
  @ApiProperty() snapshot_date: string;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() lot_id: number | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiProperty() location_id: number;
  @ApiPropertyOptional() location_name: string | null;
  @ApiProperty() quantity_on_hand: number;
  @ApiPropertyOptional() storage_days: number | null;
  @ApiPropertyOptional() daily_storage_charge: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() rate_id: number | null;
  @ApiPropertyOptional() client_id: number | null;
  @ApiPropertyOptional() owner_client_id: number | null;
  @ApiPropertyOptional() is_billed: boolean | null;
}

export class SnapshotsResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [StorageSnapshotDto] })
  data: StorageSnapshotDto[];
}

export class SnapshotGenerateResultDto {
  @ApiProperty() message: string;
  @ApiProperty() tenantId: string;
}

export class ClientDto {
  @ApiProperty() client_id: number;
  @ApiProperty() client_code: string;
  @ApiProperty() client_name: string;
}

export class ProductDto {
  @ApiProperty() product_id: number;
  @ApiProperty() product_code: string;
  @ApiProperty() product_name: string;
}

export class StorageChargeDto {
  @ApiProperty() charge_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() billing_cycle_id: number | null;
  @ApiProperty() owner_client_id: number;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() product_id: number | null;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() lot_id: number | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiPropertyOptional() location_id: number | null;
  @ApiProperty() storage_start_date: string;
  @ApiPropertyOptional() storage_end_date: string | null;
  @ApiProperty() days_in_storage: number;
  @ApiPropertyOptional() volume_stored: number | null;
  @ApiProperty() unit_type: string;
  @ApiPropertyOptional() applicable_rate: number | null;
  @ApiPropertyOptional() charge_amount: number | null;
  @ApiPropertyOptional() currency: string | null;
  @ApiPropertyOptional() charge_method: string | null;
  @ApiPropertyOptional() snapshot_id: number | null;
  @ApiPropertyOptional() is_voided: boolean | null;
  @ApiPropertyOptional() void_reason: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() clients: ClientDto | null;
  @ApiPropertyOptional() products: ProductDto | null;
}

export class ChargesResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [StorageChargeDto] })
  data: StorageChargeDto[];
}

export class ClientInvoiceLineDto {
  @ApiProperty() line_id: number;
  @ApiProperty() invoice_id: number;
  @ApiProperty() charge_type: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() quantity: number | null;
  @ApiPropertyOptional() unit_rate: number | null;
  @ApiPropertyOptional() line_total: number | null;
  @ApiPropertyOptional() currency: string | null;
}

export class ClientInvoiceDto {
  @ApiProperty() invoice_id: number;
  @ApiPropertyOptional() tenant_id: string | null;
  @ApiPropertyOptional() client_id: number;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() billing_cycle_id: number | null;
  @ApiPropertyOptional() cycle_name: string | null;
  @ApiPropertyOptional() invoice_date: string | null;
  @ApiPropertyOptional() due_date: string | null;
  @ApiPropertyOptional() total_storage_charges: number | null;
  @ApiPropertyOptional() total_vas_charges: number | null;
  @ApiPropertyOptional() total_amount: number | null;
  @ApiPropertyOptional() currency_code: string | null;
  @ApiPropertyOptional() payment_status: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional({ type: [ClientInvoiceLineDto] }) client_invoice_lines: ClientInvoiceLineDto[] | null;
  @ApiPropertyOptional({ type: ClientDto }) clients: ClientDto | null;
}

export class CreateStorageRateDto {
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() location_zone_type?: string;
  @ApiProperty() unit_type: string;
  @ApiProperty() rate_per_unit: number;
  @ApiPropertyOptional() rate_currency?: string;
  @ApiPropertyOptional() rate_calculation_method?: string;
  @ApiPropertyOptional() minimum_charge_days?: number;
  @ApiPropertyOptional() free_storage_days?: number;
  @ApiPropertyOptional() effective_from?: string;
  @ApiPropertyOptional() effective_to?: string;
}

export class UpdateStorageRateDto {
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() location_zone_type?: string;
  @ApiPropertyOptional() unit_type?: string;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() rate_currency?: string;
  @ApiPropertyOptional() rate_calculation_method?: string;
  @ApiPropertyOptional() minimum_charge_days?: number;
  @ApiPropertyOptional() free_storage_days?: number;
  @ApiPropertyOptional() effective_from?: string;
  @ApiPropertyOptional() effective_to?: string;
}

export class CreateClientRateDto {
  @ApiPropertyOptional() rate_master_id?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() rate_currency?: string;
  @ApiPropertyOptional() effective_from?: string;
  @ApiPropertyOptional() effective_to?: string;
}

export class UpdateClientRateDto {
  @ApiPropertyOptional() rate_master_id?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() rate_per_unit?: number;
  @ApiPropertyOptional() rate_currency?: string;
  @ApiPropertyOptional() effective_from?: string;
  @ApiPropertyOptional() effective_to?: string;
}

export class CreateBillingCycleDto {
  @ApiProperty() cycle_number: string;
  @ApiPropertyOptional() cycle_name?: string;
  @ApiProperty() client_id: string;
  @ApiProperty() cycle_start_date: string;
  @ApiProperty() cycle_end_date: string;
  @ApiProperty() billing_frequency: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() currency_code?: string;
}

export class UpdateBillingCycleDto {
  @ApiPropertyOptional() cycle_name?: string;
  @ApiPropertyOptional() cycle_start_date?: string;
  @ApiPropertyOptional() cycle_end_date?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() total_storage_charges?: number;
  @ApiPropertyOptional() total_handling_charges?: number;
  @ApiPropertyOptional() total_vas_charges?: number;
  @ApiPropertyOptional() total_shipping_charges?: number;
  @ApiPropertyOptional() total_other_charges?: number;
  @ApiPropertyOptional() grand_total?: number;
}

export class GenerateSnapshotDto {
  @ApiProperty() facility_id: string;
}

export class GenerateInvoiceDto {
  @ApiProperty() client_id: string;
}

export class InvoicesResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ClientInvoiceDto] })
  data: ClientInvoiceDto[];
}

