import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class CrossDockOperationDto {
  @ApiProperty() cross_dock_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() cross_dock_number: string;
  @ApiProperty() status: string;
  @ApiProperty() sku: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() unit_of_measure?: string;
  @ApiPropertyOptional() inbound_shipment_id?: string;
  @ApiPropertyOptional() outbound_shipment_id?: string;
  @ApiPropertyOptional() receiving_dock_id?: string;
  @ApiPropertyOptional() shipping_dock_id?: string;
  @ApiPropertyOptional() staging_location_id?: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() expected_arrival_time?: Date;
  @ApiPropertyOptional() actual_arrival_time?: Date;
  @ApiPropertyOptional() expected_departure_time?: Date;
  @ApiPropertyOptional() actual_departure_time?: Date;
  @ApiPropertyOptional() transfer_start_time?: Date;
  @ApiPropertyOptional() transfer_end_time?: Date;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() assigned_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() customer_order_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class CrossDockOperationPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [CrossDockOperationDto] })
  data: CrossDockOperationDto[];
}

export class CreateCrossDockDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() cross_dock_number: string;
  @ApiPropertyOptional() inbound_shipment_id?: string;
  @ApiPropertyOptional() outbound_shipment_id?: string;
  @ApiProperty() product_id: string;
  @ApiProperty() sku: string;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() unit_of_measure?: string;
  @ApiPropertyOptional() receiving_dock_id?: string;
  @ApiPropertyOptional() shipping_dock_id?: string;
  @ApiPropertyOptional() staging_location_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() expected_arrival_time?: Date;
  @ApiPropertyOptional() expected_departure_time?: Date;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() customer_order_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
}

export class UpdateCrossDockDto {
  @ApiPropertyOptional() cross_dock_number?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() sku?: string;
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() unit_of_measure?: string;
  @ApiPropertyOptional() inbound_shipment_id?: string;
  @ApiPropertyOptional() outbound_shipment_id?: string;
  @ApiPropertyOptional() receiving_dock_id?: string;
  @ApiPropertyOptional() shipping_dock_id?: string;
  @ApiPropertyOptional() staging_location_id?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() expected_arrival_time?: Date;
  @ApiPropertyOptional() actual_arrival_time?: Date;
  @ApiPropertyOptional() expected_departure_time?: Date;
  @ApiPropertyOptional() actual_departure_time?: Date;
  @ApiPropertyOptional() transfer_start_time?: Date;
  @ApiPropertyOptional() transfer_end_time?: Date;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() customer_order_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
}
