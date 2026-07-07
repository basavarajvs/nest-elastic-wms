import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class NcrDto {
  @ApiProperty() ncr_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() ncr_number: string;
  @ApiPropertyOptional() ncr_name?: string | null;
  @ApiProperty() description: string;
  @ApiPropertyOptional() reference_type?: string | null;
  @ApiPropertyOptional() reference_id?: bigint | null;
  @ApiPropertyOptional() product_id?: bigint | null;
  @ApiPropertyOptional() product_name?: string;
  @ApiPropertyOptional() lot_id?: bigint | null;
  @ApiProperty() severity: string;
  @ApiProperty() status: string;
  @ApiProperty() reported_by_user_id: string;
  @ApiPropertyOptional() assigned_to_user_id?: string | null;
  @ApiPropertyOptional() root_cause_description?: string | null;
  @ApiPropertyOptional() resolution_description?: string | null;
  @ApiPropertyOptional() corrective_action_required?: boolean | null;
  @ApiPropertyOptional() corrective_action_taken?: string | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiPropertyOptional() reported_at?: Date | null;
  @ApiPropertyOptional() resolved_at?: Date | null;
  @ApiPropertyOptional() closed_at?: Date | null;
  @ApiPropertyOptional() created_by?: string | null;
  @ApiPropertyOptional() updated_by?: string | null;
  @ApiPropertyOptional() created_at?: Date | null;
  @ApiPropertyOptional() updated_at?: Date | null;
  @ApiPropertyOptional() version?: bigint | null;
}

export class CreateNcrDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() ncr_number: string;
  @ApiPropertyOptional() ncr_name?: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() severity?: string;
  @ApiProperty() reported_by_user_id: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() corrective_action_required?: boolean;
}

export class UpdateNcrDto {
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() severity?: string;
  @ApiPropertyOptional() root_cause_description?: string;
  @ApiPropertyOptional() resolution_description?: string;
  @ApiPropertyOptional() corrective_action_required?: boolean;
  @ApiPropertyOptional() corrective_action_taken?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() status?: string;
}

export class NcrPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [NcrDto] })
  data: NcrDto[];
}
