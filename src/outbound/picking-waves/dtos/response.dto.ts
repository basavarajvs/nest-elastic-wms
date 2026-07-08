import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class PickingWaveDto {
  @ApiProperty() wave_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() wave_number: string;
  @ApiPropertyOptional() wave_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() wave_type?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() order_count?: number;
  @ApiPropertyOptional() total_tasks?: number;
  @ApiPropertyOptional() completed_tasks?: number;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() released_at?: Date;
  @ApiPropertyOptional() started_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() selection_criteria_json?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_date: Date;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class PickingWavePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [PickingWaveDto] })
  data: PickingWaveDto[];
}

export class PickingWaveDetailDto extends PickingWaveDto {
  @ApiPropertyOptional({ type: [Object] }) orders?: any[];
  @ApiPropertyOptional({ type: [Object] }) tasks?: any[];
  @ApiPropertyOptional() summary?: {
    ordersCount: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionPct: number;
    tasksByStatus: Record<string, number>;
  };
}

export class WaveOrderDto {
  @ApiProperty() wave_order_id: string;
  @ApiProperty() wave_id: string;
  @ApiProperty() order_id: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() added_at?: Date;
  @ApiPropertyOptional() released_at?: Date;
  @ApiPropertyOptional() completed_at?: Date;
  @ApiPropertyOptional() removed_at?: Date;
  @ApiPropertyOptional() added_by?: string;
  @ApiPropertyOptional() removed_by?: string;
}

export class WaveTaskDto {
  @ApiProperty() task_id: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() product?: any;
  @ApiPropertyOptional() location?: any;
}

export class CreatePickingWaveDto {
  @ApiProperty() facility_id: string;
  @ApiProperty({ type: [String] }) order_ids: string[];
  @ApiPropertyOptional() wave_number?: string;
  @ApiPropertyOptional() wave_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() wave_type?: string;
  @ApiPropertyOptional() selection_criteria_json?: string;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class UpdatePickingWaveDto {
  @ApiPropertyOptional() wave_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() wave_type?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() scheduled_start_time?: Date;
  @ApiPropertyOptional() notes?: string;
}
