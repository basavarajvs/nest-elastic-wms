import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StagingLaneDto {
  @ApiProperty() lane_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() lane_code: string;
  @ApiPropertyOptional() lane_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() current_carton_count?: number;
  @ApiPropertyOptional() max_cartons?: number;
  @ApiPropertyOptional() assigned_carrier_id?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() assigned_door_id?: string;
  @ApiPropertyOptional() assigned_route_id?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class NextStagingWorkDto {
  @ApiPropertyOptional() carton?: any;
  @ApiPropertyOptional() suggestedLane?: any;
}

export class LaneContentsDto {
  @ApiProperty() lane: any;
  @ApiProperty({ type: [Object] }) cartons: any[];
  @ApiProperty() cartonCount: number;
}

export class ScanCartonResultDto {
  @ApiProperty() lpn_id: string;
  @ApiProperty() lpn_number: string;
  @ApiProperty() status: string;
}

export class MoveToLaneResultDto {
  @ApiProperty() lpn: any;
  @ApiProperty() lane: any;
}

export class CreateStagingLaneDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() lane_code: string;
  @ApiPropertyOptional() lane_type?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() zone_id?: string;
  @ApiPropertyOptional() assigned_carrier_id?: string;
  @ApiPropertyOptional() assigned_door_id?: string;
  @ApiPropertyOptional() assigned_route_id?: string;
  @ApiPropertyOptional() max_cartons?: number;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfGetNextStagingDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfScanCartonStagingDto {
  @ApiPropertyOptional() carton_barcode?: string;
  @ApiPropertyOptional() barcode?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfConfirmLaneDto {
  @ApiProperty() lpn_id: string;
  @ApiProperty() lane_id: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfMyStagingTasksDto {
  @ApiPropertyOptional() facility_id?: string;
}

export class RfUndoStageDto {
  @ApiProperty() lpn_id: string;
  @ApiPropertyOptional() reason_code?: string;
}

export class RfLaneContentsDto {
  @ApiProperty() lane_code: string;
  @ApiPropertyOptional() facility_id?: string;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfGetNextStagingResponseDto {
  @ApiPropertyOptional({ type: Object }) carton?: any;
  @ApiPropertyOptional({ type: Object }) suggestedLane?: any;
}

export class RfScanCartonStagingResponseDto {
  @ApiPropertyOptional() lpn_id?: string;
  @ApiPropertyOptional() lpn_number?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional({ type: Object }) lpn?: any;
}

export class RfConfirmLaneResponseDto {
  @ApiPropertyOptional({ type: Object }) lpn?: any;
  @ApiPropertyOptional({ type: Object }) lane?: any;
}

export class RfMyStagingTasksResponseDto {
  @ApiPropertyOptional({ type: [Object] }) lanes?: any[];
}

export class RfUndoStageResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfLaneContentsResponseDto {
  @ApiPropertyOptional({ type: Object }) lane?: any;
  @ApiPropertyOptional({ type: [Object] }) cartons?: any[];
  @ApiPropertyOptional() cartonCount?: number;
}
