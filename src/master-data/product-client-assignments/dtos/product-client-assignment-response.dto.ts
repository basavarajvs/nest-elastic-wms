import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductClientAssignmentResponseDto {
  @ApiProperty() assignment_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: bigint;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() product_id: bigint;
  @ApiPropertyOptional() product_name?: string;
  @ApiProperty() client_id: bigint;
  @ApiPropertyOptional() client_name?: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() effective_date?: Date;
  @ApiPropertyOptional() expiry_date?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: number;
}

export class CreateProductClientAssignmentDto {
  @ApiProperty() product_id: number;
  @ApiProperty() client_id: number;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() effective_date?: string;
  @ApiPropertyOptional() expiry_date?: string;
  @ApiPropertyOptional() notes?: string;
}
