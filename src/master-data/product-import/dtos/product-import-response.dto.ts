import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateImportJobDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() file_name: string;
  @ApiProperty() file_format: string;
  @ApiPropertyOptional() job_name?: string;
}

export class ProductImportResponseDto {
  @ApiProperty() job_id: bigint;
  @ApiProperty() tenant_id: string;
  @ApiProperty() job_number: string;
  @ApiProperty() job_name?: string;
  @ApiProperty() file_name: string;
  @ApiProperty() file_format: string;
  @ApiProperty() job_status: string;
  @ApiProperty() total_rows?: number;
  @ApiProperty() processed_rows?: number;
  @ApiProperty() successful_rows?: number;
  @ApiProperty() failed_rows?: number;
  @ApiProperty() created_at?: Date;
  @ApiProperty() updated_at?: Date;
}
