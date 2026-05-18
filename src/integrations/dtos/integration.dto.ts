import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class IntegrationConfigDto {
  id: string;
  tenantId: string;
  integrationType: string;
  status: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  lastSyncAt: string | null;
}

export class InventorySyncDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsUUID()
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  facilityId?: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  externalVariantId: string;

  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class WebhookPayload {
  @ApiProperty({ type: String, required: true })
  @IsString()
  platform: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  tenantCode: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  eventType: string;

  rawBody: string;

  headers: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  parsedBody?: any;
}

export class SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: string[];
}
