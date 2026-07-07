import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UomResponseDto {
  @ApiProperty() uom_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() uom_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiPropertyOptional() created_at?: Date;
  @ApiPropertyOptional() updated_at?: Date;
  @ApiPropertyOptional() version?: bigint;
}

export class CreateUomDto {
  @ApiProperty() uom_code: string;
  @ApiProperty() uom_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateUomDto {
  @ApiPropertyOptional() uom_code?: string;
  @ApiPropertyOptional() uom_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() is_active?: boolean;
}
