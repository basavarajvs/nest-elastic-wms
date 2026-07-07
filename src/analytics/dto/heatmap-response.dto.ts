import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class LocationPickHeatmapRowDto {
  @ApiProperty({ description: 'Heatmap record ID' })
  heatmap_id: number;

  @ApiProperty({ description: 'Location ID' })
  location_id: number;

  @ApiProperty({ description: 'Location code' })
  location_code: string;

  @ApiProperty({ required: false, description: 'Zone ID' })
  zone_id: number | null;

  @ApiProperty({ required: false, description: 'Zone type' })
  zone_type: string | null;

  @ApiProperty({ description: 'Analysis date' })
  analysis_date: string;

  @ApiProperty({ required: false, description: 'Week number' })
  week_number: number | null;

  @ApiProperty({ required: false, description: 'Month number' })
  month_number: number | null;

  @ApiProperty({ required: false, description: 'Year number' })
  year_number: number | null;

  @ApiProperty({ required: false, description: 'Total pick count' })
  total_picks: number | null;

  @ApiProperty({ required: false, description: 'Unique products picked' })
  unique_products_picked: number | null;

  @ApiProperty({ required: false, description: 'Total quantity picked' })
  total_quantity_picked: number | null;

  @ApiProperty({ required: false, description: 'Average pick time in seconds' })
  average_pick_time_seconds: number | null;

  @ApiProperty({ required: false, description: 'Pick density score' })
  pick_density_score: number | null;

  @ApiProperty({ required: false, description: 'Density class' })
  density_class: string | null;

  @ApiProperty({ required: false, description: 'Picks per day' })
  picks_per_day: number | null;

  @ApiProperty({ required: false, description: 'Zone rank' })
  zone_rank: number | null;

  @ApiProperty({ required: false, description: 'Facility rank' })
  facility_rank: number | null;

  @ApiProperty({ required: false, description: 'Last picked at timestamp' })
  last_picked_at: string | null;

  @ApiProperty({ required: false, description: 'Days since last pick' })
  days_since_last_pick: number | null;
}

export class PickHeatmapResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [LocationPickHeatmapRowDto], description: 'Pick heatmap data rows' })
  data: LocationPickHeatmapRowDto[];
}

export class TopLocationRowDto {
  @ApiProperty({ description: 'Location ID' })
  location_id: number;

  @ApiProperty({ description: 'Location code' })
  location_code: string;

  @ApiProperty({ required: false, description: 'Zone ID' })
  zone_id: number | null;

  @ApiProperty({ description: 'Total pick count' })
  total_picks: number;

  @ApiProperty({ description: 'Total quantity picked' })
  total_quantity_picked: number;

  @ApiProperty({ description: 'Average pick density score' })
  avg_density_score: number;

  @ApiProperty({ description: 'Last analysis date' })
  last_analysis_date: string;
}
