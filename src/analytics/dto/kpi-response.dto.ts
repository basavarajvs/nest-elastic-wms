import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class DailyKpiMetricRowDto {
  @ApiProperty({ description: 'KPI record ID' })
  kpi_id: number;

  @ApiProperty({ description: 'Facility ID' })
  facility_id: number;

  @ApiProperty({ description: 'Metric date' })
  metric_date: string;

  @ApiProperty({ required: false, description: 'ASNs received count' })
  asns_received: number | null;

  @ApiProperty({ required: false, description: 'GRNs created count' })
  grns_created: number | null;

  @ApiProperty({ required: false, description: 'Units received' })
  units_received: number | null;

  @ApiProperty({ required: false, description: 'Putaway tasks completed' })
  putaway_tasks_completed: number | null;

  @ApiProperty({ required: false, description: 'Average receiving time in minutes' })
  average_receiving_time_minutes: number | null;

  @ApiProperty({ required: false, description: 'Total inventory units' })
  total_inventory_units: number | null;

  @ApiProperty({ required: false, description: 'Total inventory value' })
  total_inventory_value: number | null;

  @ApiProperty({ required: false, description: 'Inventory locations occupied' })
  inventory_locations_occupied: number | null;

  @ApiProperty({ required: false, description: 'Inventory locations available' })
  inventory_locations_available: number | null;

  @ApiProperty({ required: false, description: 'Location utilization percentage' })
  location_utilization_pct: number | null;

  @ApiProperty({ required: false, description: 'Orders received' })
  orders_received: number | null;

  @ApiProperty({ required: false, description: 'Orders shipped' })
  orders_shipped: number | null;

  @ApiProperty({ required: false, description: 'Units shipped' })
  units_shipped: number | null;

  @ApiProperty({ required: false, description: 'Picking tasks completed' })
  picking_tasks_completed: number | null;

  @ApiProperty({ required: false, description: 'Packing tasks completed' })
  packing_tasks_completed: number | null;

  @ApiProperty({ required: false, description: 'Average picking time in minutes' })
  average_picking_time_minutes: number | null;

  @ApiProperty({ required: false, description: 'Average packing time in minutes' })
  average_packing_time_minutes: number | null;

  @ApiProperty({ required: false, description: 'VAS tasks created' })
  vas_tasks_created: number | null;

  @ApiProperty({ required: false, description: 'VAS tasks completed' })
  vas_tasks_completed: number | null;

  @ApiProperty({ required: false, description: 'VAS revenue' })
  vas_revenue: number | null;

  @ApiProperty({ required: false, description: 'Total charges generated' })
  total_charges_generated: number | null;

  @ApiProperty({ required: false, description: 'Invoices generated' })
  invoices_generated: number | null;

  @ApiProperty({ required: false, description: 'Quality inspections passed' })
  quality_inspections_passed: number | null;

  @ApiProperty({ required: false, description: 'Quality inspections failed' })
  quality_inspections_failed: number | null;

  @ApiProperty({ required: false, description: 'Defect rate percentage' })
  defect_rate_pct: number | null;

  @ApiProperty({ required: false, description: 'Order fill rate percentage' })
  order_fill_rate_pct: number | null;

  @ApiProperty({ required: false, description: 'On-time shipment rate percentage' })
  on_time_shipment_rate_pct: number | null;

  @ApiProperty({ required: false, description: 'Inventory accuracy percentage' })
  inventory_accuracy_pct: number | null;

  @ApiProperty({ required: false, description: 'Total labor hours' })
  total_labor_hours: number | null;

  @ApiProperty({ required: false, description: 'Units per labor hour' })
  units_per_labor_hour: number | null;
}

export class DailyKpiResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [DailyKpiMetricRowDto], description: 'Daily KPI metric data rows' })
  data: DailyKpiMetricRowDto[];
}

export class KpiMetricSummaryDto {
  @ApiProperty({ description: 'Metric name/key' })
  metric_name: string;

  @ApiProperty({ description: 'Aggregated total value' })
  total_value: number;
}
