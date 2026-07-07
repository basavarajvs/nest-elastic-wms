import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class ReplenishmentRuleDto {
  @ApiProperty() rule_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() to_location_name?: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() min_quantity?: number;
  @ApiPropertyOptional() max_quantity?: number;
  @ApiPropertyOptional() reorder_point?: number;
  @ApiPropertyOptional() reorder_quantity?: number;
  @ApiProperty() priority: number;
  @ApiProperty() is_active: boolean;
  @ApiProperty() auto_generate_tasks: boolean;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ReplenishmentRulePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ReplenishmentRuleDto] })
  data: ReplenishmentRuleDto[];
}

export class ReplenishmentTaskDto {
  @ApiProperty() task_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() task_number: string;
  @ApiPropertyOptional() task_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() from_location_name?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() to_location_name?: string;
  @ApiProperty() quantity_requested: number;
  @ApiPropertyOptional() quantity_moved?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiProperty() status: string;
  @ApiProperty() priority: number;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() rule_id?: string;
  @ApiPropertyOptional() due_date?: Date;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_date: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ReplenishmentTaskPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ReplenishmentTaskDto] })
  data: ReplenishmentTaskDto[];
}

export class ReplenishmentScanResultDto {
  @ApiProperty() task: any;
  @ApiPropertyOptional() location?: any;
  @ApiPropertyOptional() product?: any;
  @ApiProperty() locationVerified?: boolean;
  @ApiProperty() productVerified?: boolean;
}

export class CreateReplenishmentRuleDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() product_id: string;
  @ApiPropertyOptional() from_location_id?: string;
  @ApiPropertyOptional() to_location_id?: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() min_quantity?: number;
  @ApiPropertyOptional() max_quantity?: number;
  @ApiPropertyOptional() reorder_point?: number;
  @ApiPropertyOptional() reorder_quantity?: number;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() auto_generate_tasks?: boolean;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateReplenishmentRuleDto {
  @ApiPropertyOptional() min_quantity?: number;
  @ApiPropertyOptional() max_quantity?: number;
  @ApiPropertyOptional() reorder_point?: number;
  @ApiPropertyOptional() reorder_quantity?: number;
  @ApiPropertyOptional() priority?: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() auto_generate_tasks?: boolean;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateReplenishmentTaskDto {
  @ApiPropertyOptional() task_number?: string;
  @ApiPropertyOptional() task_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() quantity_moved?: number;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() notes?: string;
}
