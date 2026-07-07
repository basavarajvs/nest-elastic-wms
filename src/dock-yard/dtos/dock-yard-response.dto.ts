import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class CreateDockAppointmentDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() appointment_number?: string;
  @ApiPropertyOptional() appointment_type?: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() vendor_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() contact_name?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() vehicle_type?: string;
  @ApiPropertyOptional() license_plate?: string;
  @ApiProperty() requested_date: string;
  @ApiProperty() time_slot_start: string;
  @ApiProperty() time_slot_end: string;
  @ApiPropertyOptional() assigned_dock_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateDockAppointmentDto {
  @ApiPropertyOptional() appointment_type?: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() vendor_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() contact_name?: string;
  @ApiPropertyOptional() contact_phone?: string;
  @ApiPropertyOptional() vehicle_type?: string;
  @ApiPropertyOptional() license_plate?: string;
  @ApiPropertyOptional() requested_date?: string;
  @ApiPropertyOptional() time_slot_start?: string;
  @ApiPropertyOptional() time_slot_end?: string;
  @ApiPropertyOptional() assigned_dock_id?: string;
  @ApiPropertyOptional() notes?: string;
}

export class CreateYardVehicleDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() vehicle_type?: string;
  @ApiPropertyOptional() license_plate?: string;
  @ApiPropertyOptional() vin?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() current_location_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateYardVehicleDto {
  @ApiPropertyOptional() vehicle_type?: string;
  @ApiPropertyOptional() license_plate?: string;
  @ApiPropertyOptional() vin?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() current_location_code?: string;
  @ApiPropertyOptional() notes?: string;
}

export class ConfirmAppointmentDto {
  @ApiPropertyOptional() confirmed_by_user_id?: string;
}

export class CheckInAppointmentDto {
  @ApiPropertyOptional() assigned_dock_id?: string;
}

export class DockAppointmentDto {
  @ApiProperty() appointment_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() appointment_number: string;
  @ApiProperty() appointment_type: string;
  @ApiPropertyOptional() reference_type: string | null;
  @ApiPropertyOptional() reference_id: number | null;
  @ApiPropertyOptional() vendor_id: number | null;
  @ApiPropertyOptional() vendor_name: string | null;
  @ApiPropertyOptional() carrier_id: number | null;
  @ApiPropertyOptional() carrier_name: string | null;
  @ApiPropertyOptional() contact_name: string | null;
  @ApiPropertyOptional() contact_phone: string | null;
  @ApiPropertyOptional() vehicle_type: string | null;
  @ApiPropertyOptional() license_plate: string | null;
  @ApiProperty() requested_date: string;
  @ApiProperty() requested_time_slot_start: string;
  @ApiProperty() requested_time_slot_end: string;
  @ApiPropertyOptional() assigned_dock_id: number | null;
  @ApiPropertyOptional() dock_name: string | null;
  @ApiPropertyOptional() confirmed_at: string | null;
  @ApiPropertyOptional() confirmed_by_user_id: string | null;
  @ApiPropertyOptional() arrived_at: string | null;
  @ApiPropertyOptional() started_at: string | null;
  @ApiPropertyOptional() finished_at: string | null;
  @ApiPropertyOptional() departed_at: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class DockAppointmentsResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [DockAppointmentDto] })
  data: DockAppointmentDto[];
}

export class YardVehicleDto {
  @ApiProperty() vehicle_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() vehicle_type: string;
  @ApiPropertyOptional() license_plate: string | null;
  @ApiPropertyOptional() vin: string | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() current_location_code: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() assigned_to_reference_type: string | null;
  @ApiPropertyOptional() assigned_to_reference_id: number | null;
  @ApiPropertyOptional() arrival_time: string | null;
  @ApiPropertyOptional() departure_time: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class YardVehiclesResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [YardVehicleDto] })
  data: YardVehicleDto[];
}

