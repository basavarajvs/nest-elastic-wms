import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class InventoryTransferDto {
  @ApiProperty() id: bigint;
  @ApiProperty() transfer_number: string;
  @ApiProperty() status: string;
  @ApiProperty() source_warehouse_id: bigint;
  @ApiProperty() destination_warehouse_id: bigint;
  @ApiProperty() facility_code?: string;
  @ApiProperty() source_warehouse_name?: string;
  @ApiProperty() destination_warehouse_name?: string;
  @ApiProperty() notes?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class InventoryTransferLineDto {
  @ApiProperty() id: bigint;
  @ApiProperty() transfer_id: bigint;
  @ApiProperty() line_number: number;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() quantity: number;
  @ApiProperty() uom: string;
  @ApiProperty() lot_number?: string;
  @ApiProperty() quantity_dispatched?: number;
  @ApiProperty() quantity_received?: number;
}

export class TransferPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [InventoryTransferDto] })
  data: InventoryTransferDto[];
}

export class CreateTransferDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() source_warehouse_id: string;
  @ApiProperty() destination_warehouse_id: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() lines?: CreateTransferLineDto[];
}

export class CreateTransferLineDto {
  @ApiProperty() product_id: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() uom?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() notes?: string;
}

export class DispatchTransferDto {
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() lines?: DispatchLineDto[];
}

export class DispatchLineDto {
  @ApiProperty() line_id: string;
  @ApiPropertyOptional() quantity?: number;
}

export class ReceiveTransferDto {
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() lines?: ReceiveLineDto[];
}

export class ReceiveLineDto {
  @ApiProperty() line_id: string;
  @ApiPropertyOptional() quantity?: number;
}

export class CancelTransferDto {
  @ApiPropertyOptional() reason?: string;
}

export class LpnScanResultDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() lpn_number?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() facility_name?: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfTransferInitiateDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() source_warehouse_id: string;
  @ApiProperty() destination_warehouse_id: string;
  @ApiPropertyOptional() notes?: string;
}

export class RfTransferScanLpnDto {
  @ApiProperty() barcode: string;
}

export class RfTransferCompleteDto {
  @ApiProperty() transfer_id: string;
  @ApiPropertyOptional() notes?: string;
}
