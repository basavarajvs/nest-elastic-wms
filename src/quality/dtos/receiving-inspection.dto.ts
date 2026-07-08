import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class ReceivingInspectionDto {
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() inspection_number: string;
  @ApiPropertyOptional() inspection_name?: string;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: bigint;
  @ApiPropertyOptional() product_id?: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiProperty() inspection_type: string;
  @ApiProperty() inspection_scope?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() result?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiPropertyOptional() findings_summary?: string;
  @ApiPropertyOptional() total_items_inspected?: number;
  @ApiPropertyOptional() total_passed_items?: number;
  @ApiPropertyOptional() total_failed_items?: number;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
}

export class QcDispositionDto {
  @ApiProperty() id: bigint;
  @ApiProperty() receipt_line_id: bigint;
  @ApiProperty() product_id: bigint;
  @ApiProperty() disposition_type: string;
  @ApiProperty() disposition_qty: number;
  @ApiProperty() reason_code?: string;
  @ApiProperty() notes?: string;
}

export class CreateReceivingInspectionDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() inspection_name?: string;
  @ApiProperty() receipt_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() inspection_type?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() created_by?: string;
}

export class CreateQcDispositionDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() receipt_line_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() disposition_type: string;
  @ApiPropertyOptional() disposition_qty?: number;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() inspector_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
}

export class ReceivingInspectionPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ReceivingInspectionDto] })
  data: ReceivingInspectionDto[];
}
