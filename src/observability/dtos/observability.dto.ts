import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseEventResponseDto {
  @ApiProperty() event_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() event_type: string;
  @ApiProperty() severity: string;
  @ApiPropertyOptional() related_object_type?: string;
  @ApiPropertyOptional() related_object_id?: bigint;
  @ApiProperty() description: string;
  @ApiProperty() created_at: Date;
}

export class AuditLogResponseDto {
  @ApiProperty() audit_log_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() action: string;
  @ApiProperty() table_name: string;
  @ApiPropertyOptional() record_id?: string;
  @ApiPropertyOptional() user_id?: string;
  @ApiProperty() action_timestamp: Date;
}
