import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class CreateEquipmentDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() equipment_name: string;
  @ApiProperty() equipment_code: string;
  @ApiProperty() equipment_type: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() model_number?: string;
  @ApiPropertyOptional() serial_number?: string;
  @ApiPropertyOptional() manufacturer?: string;
  @ApiPropertyOptional() purchase_date?: string;
  @ApiPropertyOptional() purchase_cost?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() current_location_id?: string;
  @ApiPropertyOptional() assigned_user_id?: string;
  @ApiPropertyOptional() last_maintenance_date?: string;
  @ApiPropertyOptional() next_maintenance_date?: string;
  @ApiPropertyOptional() maintenance_interval_months?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional() equipment_name?: string;
  @ApiPropertyOptional() equipment_code?: string;
  @ApiPropertyOptional() equipment_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() model_number?: string;
  @ApiPropertyOptional() serial_number?: string;
  @ApiPropertyOptional() manufacturer?: string;
  @ApiPropertyOptional() purchase_date?: string;
  @ApiPropertyOptional() purchase_cost?: number;
  @ApiPropertyOptional() current_location_id?: string;
  @ApiPropertyOptional() assigned_user_id?: string;
  @ApiPropertyOptional() last_maintenance_date?: string;
  @ApiPropertyOptional() next_maintenance_date?: string;
  @ApiPropertyOptional() maintenance_interval_months?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateEquipmentStatusDto {
  @ApiProperty() status: string;
}

export class CreateMaintenanceDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() equipment_id: string;
  @ApiProperty() maintenance_type: string;
  @ApiPropertyOptional() maintenance_date?: string;
  @ApiPropertyOptional() next_maintenance_date?: string;
  @ApiPropertyOptional() performed_by_user_id?: string;
  @ApiPropertyOptional() technician_name?: string;
  @ApiPropertyOptional() maintenance_cost?: number;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() duration_minutes?: number;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() maintenance_type?: string;
  @ApiPropertyOptional() maintenance_date?: string;
  @ApiPropertyOptional() next_maintenance_date?: string;
  @ApiPropertyOptional() performed_by_user_id?: string;
  @ApiPropertyOptional() technician_name?: string;
  @ApiPropertyOptional() maintenance_cost?: number;
  @ApiPropertyOptional() duration_minutes?: number;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() notes?: string;
}

export class CompleteMaintenanceDto {
  @ApiPropertyOptional() maintenance_cost?: number;
  @ApiPropertyOptional() duration_minutes?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() performed_by_user_id?: string;
  @ApiPropertyOptional() technician_name?: string;
  @ApiPropertyOptional() next_maintenance_date?: string;
}

export class WarehouseEquipmentDto {
  @ApiProperty() equipment_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiProperty() facility_name: string;
  @ApiProperty() equipment_name: string;
  @ApiProperty() equipment_code: string;
  @ApiProperty() equipment_type: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() model_number: string | null;
  @ApiPropertyOptional() serial_number: string | null;
  @ApiPropertyOptional() manufacturer: string | null;
  @ApiPropertyOptional() purchase_date: string | null;
  @ApiPropertyOptional() purchase_cost: number | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() current_location_id: number | null;
  @ApiPropertyOptional() assigned_user_id: string | null;
  @ApiPropertyOptional() last_maintenance_date: string | null;
  @ApiPropertyOptional() next_maintenance_date: string | null;
  @ApiPropertyOptional() maintenance_interval_months: number | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class EquipmentListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [WarehouseEquipmentDto] })
  data: WarehouseEquipmentDto[];
}

export class EquipmentMaintenanceDto {
  @ApiProperty() maintenance_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiProperty() facility_name: string;
  @ApiProperty() equipment_id: number;
  @ApiProperty() equipment_name: string;
  @ApiProperty() maintenance_type: string;
  @ApiProperty() maintenance_date: string;
  @ApiPropertyOptional() next_maintenance_date: string | null;
  @ApiPropertyOptional() performed_by_user_id: string | null;
  @ApiPropertyOptional() technician_name: string | null;
  @ApiPropertyOptional() maintenance_cost: number | null;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() duration_minutes: number | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class MaintenanceListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [EquipmentMaintenanceDto] })
  data: EquipmentMaintenanceDto[];
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfAvailableEquipmentDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfCheckOutDto {
  @ApiPropertyOptional() user_id?: string;
}

export class RfCheckInDto {}
