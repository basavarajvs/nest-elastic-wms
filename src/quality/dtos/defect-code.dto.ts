import { ApiProperty } from '@nestjs/swagger';

export class DefectCodeDto {
  @ApiProperty() defect_code_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty() category: string;
  @ApiProperty() severity: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty() created_by?: string;
  @ApiProperty() updated_by?: string;
  @ApiProperty() created_at?: Date;
  @ApiProperty() updated_at?: Date;
}

export class CreateDefectCodeDto {
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty({ required: false }) category?: string;
  @ApiProperty({ required: false }) severity?: string;
  @ApiProperty({ required: false }) isActive?: boolean;
}

export class UpdateDefectCodeDto {
  @ApiProperty({ required: false }) code?: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ required: false }) category?: string;
  @ApiProperty({ required: false }) severity?: string;
  @ApiProperty({ required: false }) isActive?: boolean;
}
