import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AllocationRecordDto {
  @ApiProperty() allocation_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() location_id: string;
  @ApiPropertyOptional() location_name?: string;
  @ApiProperty() quantity_allocated: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiProperty() allocation_type: string;
  @ApiProperty() allocated_for_reference_type: string;
  @ApiProperty() allocated_for_reference_id: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() lot_number?: string;
  @ApiPropertyOptional() item_id?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class AllocateLineResultDto {
  @ApiProperty() allocatedQty: number;
  @ApiProperty() requestedQty: number;
  @ApiProperty() shortQty: number;
  @ApiProperty({ type: [AllocationRecordDto] })
  allocations: AllocationRecordDto[];
}

export class LineAllocationResultDto {
  @ApiProperty() lineId: string;
  @ApiPropertyOptional() allocatedQty?: number;
  @ApiPropertyOptional() requestedQty?: number;
  @ApiPropertyOptional() shortQty?: number;
  @ApiPropertyOptional({ type: [AllocationRecordDto] })
  allocations?: AllocationRecordDto[];
  @ApiPropertyOptional() error?: string;
}

export class AllocateOrderResultDto {
  @ApiProperty() orderId: string;
  @ApiProperty({ type: [LineAllocationResultDto] })
  results: LineAllocationResultDto[];
  @ApiProperty() totalShort: number;
}

export class DeallocateResultDto {
  @ApiProperty() deallocated: boolean;
  @ApiProperty() referenceType: string;
  @ApiProperty() referenceId: string;
}

export class CheckAvailabilityResultDto {
  @ApiProperty() productId: string;
  @ApiProperty() onHand: number;
  @ApiProperty() reserved: number;
  @ApiProperty() available: number;
  @ApiProperty() sufficient: boolean;
  @ApiProperty() shortQty: number;
}

export class AllocateLineDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() order_line_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() quantity: number;
}

export class AllocateOrderDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() order_id: string;
}

export class DeallocateDto {
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: string;
}

export class CheckAvailabilityDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() required_qty: number;
}


