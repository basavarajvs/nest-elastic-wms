import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class QualityHoldDto {
  @ApiProperty() hold_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() hold_number: string;
  @ApiPropertyOptional() hold_name?: string | null;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: bigint;
  @ApiPropertyOptional() product_id?: bigint | null;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: bigint | null;
  @ApiPropertyOptional() location_id?: bigint | null;
  @ApiProperty() hold_reason: string;
  @ApiPropertyOptional() hold_reason_code?: string | null;
  @ApiProperty() placed_by_user_id: string;
  @ApiPropertyOptional() released_by_user_id?: string | null;
  @ApiPropertyOptional() affected_quantity?: number | null;
  @ApiPropertyOptional() uom_id?: bigint | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() placed_at?: Date | null;
  @ApiPropertyOptional() released_at?: Date | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class CreateQualityHoldDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() hold_number: string;
  @ApiPropertyOptional() hold_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() reference_type: string;
  @ApiProperty() reference_id: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiProperty() hold_reason: string;
  @ApiPropertyOptional() hold_reason_code?: string;
  @ApiProperty() placed_by_user_id: string;
  @ApiPropertyOptional() affected_quantity?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() status?: string;
}

export class UpdateQualityHoldDto {
  @ApiPropertyOptional() hold_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() hold_reason?: string;
  @ApiPropertyOptional() hold_reason_code?: string;
  @ApiPropertyOptional() affected_quantity?: number;
  @ApiPropertyOptional() uom_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() status?: string;
}

export class ReleaseQualityHoldDto {
  @ApiPropertyOptional() reason?: string;
  @ApiPropertyOptional() released_by_user_id?: string;
}

export class QualityHoldPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [QualityHoldDto] })
  data: QualityHoldDto[];
}
