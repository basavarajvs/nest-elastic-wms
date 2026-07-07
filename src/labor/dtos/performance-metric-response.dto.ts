import { ApiProperty } from '@nestjs/swagger';

export class PerformanceMetricResponseDto {
  @ApiProperty() metric_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiProperty() facility_name: string;
  @ApiProperty() user_id: string;
  @ApiProperty() date_calculated: Date;
  @ApiProperty() task_type: string;
  @ApiProperty() total_tasks_completed?: number;
  @ApiProperty() total_quantity_processed?: number;
  @ApiProperty() efficiency_percentage?: number;
  @ApiProperty() items_per_hour?: number;
  @ApiProperty() tasks_per_hour?: number;
  @ApiProperty() created_at?: Date;
}
