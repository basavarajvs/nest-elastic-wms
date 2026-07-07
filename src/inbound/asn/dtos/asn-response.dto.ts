import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class AdvanceShipNoticeDto {
  @ApiProperty() asn_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() asn_number: string;
  @ApiPropertyOptional() vendor_id: number | null;
  @ApiPropertyOptional() vendor_name: string | null;
  @ApiPropertyOptional() po_number: string | null;
  @ApiPropertyOptional() carrier_name: string | null;
  @ApiPropertyOptional() tracking_number: string | null;
  @ApiPropertyOptional() shipment_date: string | null;
  @ApiPropertyOptional() expected_arrival_date: string | null;
  @ApiPropertyOptional() actual_arrival_date: string | null;
  @ApiPropertyOptional() weight: number | null;
  @ApiPropertyOptional() volume: number | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() status_changed_at: string | null;
  @ApiPropertyOptional() status_changed_by: number | null;
  @ApiPropertyOptional() inbound_for_client_id: number | null;
  @ApiPropertyOptional() client_name: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class AsnListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [AdvanceShipNoticeDto] })
  data: AdvanceShipNoticeDto[];
}

export class AsnLineDto {
  @ApiProperty() asn_line_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() asn_id: number;
  @ApiProperty() product_id: number;
  @ApiPropertyOptional() product_name: string | null;
  @ApiProperty() expected_quantity: number;
  @ApiPropertyOptional() received_quantity: number | null;
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
  @ApiProperty() line_status: string;
}

export class AsnImportResultDto {
  @ApiProperty() import_result_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() import_document_id: number;
  @ApiPropertyOptional() created_asn_id: number | null;
  @ApiPropertyOptional() asn_number: string | null;
  @ApiProperty() import_status: string;
  @ApiPropertyOptional() error_message: string | null;
  @ApiPropertyOptional() workflow_event_triggered: boolean | null;
  @ApiPropertyOptional() workflow_event_id: number | null;
  @ApiPropertyOptional() created_at: string | null;
}

export class AsnImportDocumentDto {
  @ApiProperty() import_document_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() import_job_id: number;
  @ApiProperty() file_name: string;
  @ApiProperty() document_type: string;
  @ApiPropertyOptional() file_size_bytes: number | null;
  @ApiPropertyOptional() file_checksum: string | null;
  @ApiPropertyOptional() storage_path: string | null;
  @ApiPropertyOptional() raw_content: string | null;
  @ApiPropertyOptional() parsing_status: string | null;
  @ApiPropertyOptional() parsed_at: string | null;
  @ApiPropertyOptional() parser_version: string | null;
  @ApiPropertyOptional() validation_status: string | null;
  @ApiPropertyOptional() validation_errors: any | null;
  @ApiPropertyOptional() created_asn_id: number | null;
  @ApiPropertyOptional() uploaded_at: string | null;
  @ApiPropertyOptional() uploaded_by: string | null;
  @ApiPropertyOptional({ type: [AsnImportResultDto] }) asn_import_results: AsnImportResultDto[] | null;
}

export class AsnImportJobDto {
  @ApiProperty() import_job_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() job_number: string;
  @ApiProperty() source_system: string;
  @ApiProperty() import_channel: string;
  @ApiPropertyOptional() job_status: string | null;
  @ApiPropertyOptional() started_at: string | null;
  @ApiPropertyOptional() completed_at: string | null;
  @ApiPropertyOptional() processed_documents: number | null;
  @ApiPropertyOptional() successful_documents: number | null;
  @ApiPropertyOptional() failed_documents: number | null;
  @ApiPropertyOptional() created_asn_ids: number[] | null;
  @ApiPropertyOptional() error_summary: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional({ type: [AsnImportDocumentDto] }) asn_import_documents: AsnImportDocumentDto[] | null;
}

export class AsnImportJobListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [AsnImportJobDto] })
  data: AsnImportJobDto[];
}

export class CreateAsnLineDto {
  @ApiProperty() product_id: number;
  @ApiProperty() expected_quantity: number;
  @ApiProperty() uom_id: number;
  @ApiPropertyOptional() lot_number: string;
  @ApiPropertyOptional() serial_numbers_json: string;
  @ApiPropertyOptional() expiry_date: string;
  @ApiPropertyOptional() notes: string;
}

export class CreateAsnDto {
  @ApiProperty() asn_number: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() vendor_id: number;
  @ApiPropertyOptional() inbound_for_client_id: number;
  @ApiPropertyOptional() po_number: string;
  @ApiPropertyOptional() carrier_name: string;
  @ApiPropertyOptional() tracking_number: string;
  @ApiPropertyOptional() shipment_date: string;
  @ApiPropertyOptional() expected_arrival_date: string;
  @ApiPropertyOptional() actual_arrival_date: string;
  @ApiPropertyOptional() weight: number;
  @ApiPropertyOptional() volume: number;
  @ApiPropertyOptional() notes: string;
  @ApiPropertyOptional({ type: [CreateAsnLineDto] })
  lines: CreateAsnLineDto[];
}

export class UpdateAsnDto {
  @ApiPropertyOptional() carrier_name: string;
  @ApiPropertyOptional() tracking_number: string;
  @ApiPropertyOptional() expected_arrival_date: string;
  @ApiPropertyOptional() actual_arrival_date: string;
  @ApiPropertyOptional() notes: string;
}

export class CreateAsnImportJobDto {
  @ApiProperty() facility_id: number;
  @ApiProperty() job_number: string;
  @ApiProperty() source_system: string;
  @ApiPropertyOptional() import_channel: string;
}
