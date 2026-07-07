import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class ReceivingInspectionDto {
  @ApiProperty() inspection_id: bigint;
  @ApiProperty() inspection_number: string;
  @ApiProperty() inspection_name?: string;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: bigint;
  @ApiProperty() product_id?: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() inspection_type: string;
  @ApiProperty() status: string;
  @ApiProperty() notes?: string;
  @ApiProperty() created_at?: Date;
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
