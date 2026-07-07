import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BarcodeLabelResponseDto {
  @ApiProperty() label_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiPropertyOptional() facility_id?: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() label_number: string;
  @ApiProperty() barcode_value: string;
  @ApiProperty() label_type: string;
  @ApiPropertyOptional() label_format?: string;
  @ApiProperty() entity_type: string;
  @ApiProperty() entity_id: bigint;
  @ApiPropertyOptional() entity_reference?: string;
  @ApiPropertyOptional() label_data_json?: any;
  @ApiPropertyOptional() human_readable_text?: string;
  @ApiPropertyOptional() label_template_name?: string;
  @ApiPropertyOptional() label_size_mm?: string;
  @ApiPropertyOptional() label_format_file?: string;
  @ApiPropertyOptional() print_status?: string;
  @ApiPropertyOptional() printed_at?: Date;
  @ApiPropertyOptional() printed_by?: bigint;
  @ApiPropertyOptional() print_count?: number;
  @ApiPropertyOptional() printer_name?: string;
  @ApiPropertyOptional() label_file_url?: string;
  @ApiPropertyOptional() label_file_format?: string;
  @ApiPropertyOptional() is_validated?: boolean;
  @ApiPropertyOptional() validated_at?: Date;
  @ApiPropertyOptional() first_scan_at?: Date;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() voided_at?: Date;
  @ApiPropertyOptional() void_reason?: string;
  @ApiPropertyOptional() created_by?: bigint;
  @ApiPropertyOptional() updated_by?: bigint;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
}

export class GenerateBarcodeLabelDto {
  @ApiPropertyOptional() facility_id?: number;
  @ApiProperty() barcode_value: string;
  @ApiProperty() label_type: string;
  @ApiPropertyOptional() label_format?: string;
  @ApiProperty() entity_type: string;
  @ApiProperty() entity_id: number;
  @ApiPropertyOptional() entity_reference?: string;
  @ApiPropertyOptional() label_data_json?: string;
  @ApiPropertyOptional() human_readable_text?: string;
  @ApiPropertyOptional() label_template_name?: string;
  @ApiPropertyOptional() label_size_mm?: string;
  @ApiPropertyOptional() label_format_file?: string;
  @ApiPropertyOptional() printer_name?: string;
  @ApiPropertyOptional() label_file_url?: string;
  @ApiPropertyOptional() label_file_format?: string;
}
