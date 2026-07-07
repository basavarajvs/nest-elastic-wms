import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class WebhookProcessResultDto {
  @ApiProperty()
  deduplicated: boolean;
  @ApiPropertyOptional()
  id: string | null;
}

export class SyncWebhookLogDto {
  @ApiPropertyOptional()
  id: string;
  @ApiPropertyOptional()
  tenant_id: string;
  @ApiPropertyOptional()
  platform: string;
  @ApiPropertyOptional()
  event_type: string;
  @ApiPropertyOptional()
  payload: any;
  @ApiPropertyOptional()
  payload_hash: string;
  @ApiPropertyOptional()
  status: string;
  @ApiPropertyOptional()
  created_at: string;
}

export class WebhookLogListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [SyncWebhookLogDto] })
  data: SyncWebhookLogDto[];
}

export class ExternalEntityMappingDto {
  @ApiPropertyOptional()
  mapping_id: string;
  @ApiPropertyOptional()
  tenant_id: string;
  @ApiPropertyOptional()
  platform: string;
  @ApiPropertyOptional()
  external_entity_type: string;
  @ApiPropertyOptional()
  external_entity_id: string;
  @ApiPropertyOptional()
  wms_entity_type: string;
  @ApiPropertyOptional()
  wms_entity_id: number;
  @ApiPropertyOptional()
  metadata: any;
  @ApiPropertyOptional()
  created_at: string;
  @ApiPropertyOptional()
  updated_at: string;
}

export class EntityMappingListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ExternalEntityMappingDto] })
  data: ExternalEntityMappingDto[];
}

export class SyncLogDto {
  @ApiPropertyOptional()
  log_id: string;
  @ApiPropertyOptional()
  tenant_id: string;
  @ApiPropertyOptional()
  platform: string;
  @ApiPropertyOptional()
  entity_type: string;
  @ApiPropertyOptional()
  entity_id: string;
  @ApiPropertyOptional()
  sync_status: string;
  @ApiPropertyOptional()
  error_message: string;
  @ApiPropertyOptional()
  created_at: string;
}

export class CreateEntityMappingDto {
  @ApiProperty() platform: string;
  @ApiProperty() external_entity_type: string;
  @ApiProperty() external_entity_id: string;
  @ApiProperty() wms_entity_type: string;
  @ApiProperty() wms_entity_id: string;
  @ApiPropertyOptional() metadata?: Record<string, any>;
}

export class SyncLogListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [SyncLogDto] })
  data: SyncLogDto[];
}
