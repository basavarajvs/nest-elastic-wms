import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class LoadDto {
  @ApiProperty() load_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() load_number: string;
  @ApiPropertyOptional() load_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() vehicle_number?: string;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() driver_phone?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() service_type?: string;
  @ApiPropertyOptional() dock_door_number?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() bol_number?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() weight_uom?: string;
  @ApiPropertyOptional() volume_uom?: string;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() loaded_cartons?: number;
  @ApiPropertyOptional() number_of_shipments?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() multi_stop?: boolean;
  @ApiPropertyOptional() total_stops?: number;
  @ApiPropertyOptional() current_stop_loading?: number;
  @ApiPropertyOptional() route_id?: string;
  @ApiPropertyOptional() planned_departure_date?: Date;
  @ApiPropertyOptional() planned_departure_time?: Date;
  @ApiPropertyOptional() actual_departure_time?: Date;
  @ApiPropertyOptional() planned_arrival_date?: Date;
  @ApiPropertyOptional() planned_arrival_time?: Date;
  @ApiPropertyOptional() load_start_time?: Date;
  @ApiPropertyOptional() load_completed_time?: Date;
  @ApiPropertyOptional() loaded_by?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class LoadPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [LoadDto] })
  data: LoadDto[];
}

export class LoadBolDto {
  @ApiProperty() bolNumber: string;
  @ApiProperty() loadNumber: string;
  @ApiPropertyOptional() carrierName?: string;
  @ApiPropertyOptional() vehicleNumber?: string;
  @ApiPropertyOptional() driverName?: string;
  @ApiProperty() generatedAt: Date;
}

export class LoadStopDto {
  @ApiProperty() stop_id: string;
  @ApiProperty() load_id: string;
  @ApiProperty() stop_sequence: number;
  @ApiProperty() location_name: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() planned_arrival?: Date;
  @ApiPropertyOptional() planned_departure?: Date;
  @ApiPropertyOptional() actual_arrival?: Date;
  @ApiPropertyOptional() actual_departure?: Date;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes?: string;
}

export class LoadSequenceDto {
  @ApiProperty() loadId: string;
  @ApiProperty() loadNumber: string;
  @ApiProperty() multiStop: boolean;
  @ApiProperty() totalStops: number;
  @ApiProperty() currentStopLoading: number;
  @ApiProperty({ type: [LoadStopDto] }) stops: LoadStopDto[];
}

export class CreateLoadDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() load_number?: string;
  @ApiPropertyOptional() load_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() vehicle_number?: string;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() driver_phone?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() service_type?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() dock_door_number?: string;
  @ApiPropertyOptional() planned_departure_date?: Date;
  @ApiPropertyOptional() planned_departure_time?: Date;
  @ApiPropertyOptional() planned_arrival_date?: Date;
  @ApiPropertyOptional() planned_arrival_time?: Date;
  @ApiPropertyOptional() weight_uom?: string;
  @ApiPropertyOptional() volume_uom?: string;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() bol_number?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() multi_stop?: boolean;
  @ApiPropertyOptional() notes?: string;
}

export class GenerateBillOfLadingDto {
  @ApiProperty() load_id: string;
  @ApiProperty() bol_number: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() vehicle_number?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() total_weight_kg?: number;
  @ApiPropertyOptional() total_volume_cbm?: number;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() total_pallets?: number;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() driver_signature?: string;
  @ApiPropertyOptional() generated_by?: string;
}

export class CompleteLoadingDto {
  @ApiPropertyOptional() loaded_cartons?: number;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() bol_number?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() actual_departure_time?: Date;
  @ApiPropertyOptional() loaded_by?: string;
}

export class CreateStopDto {
  @ApiProperty() stop_sequence: number;
  @ApiProperty() location_name: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() planned_arrival?: Date;
  @ApiPropertyOptional() planned_departure?: Date;
  @ApiPropertyOptional() actual_arrival?: Date;
  @ApiPropertyOptional() actual_departure?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class ApplyRouteResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}
