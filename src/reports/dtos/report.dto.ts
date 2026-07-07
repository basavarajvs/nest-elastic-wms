import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class ReportJobDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() report_type: string;
  @ApiProperty() parameters: any;
  @ApiProperty() status: string;
  @ApiProperty() download_url?: string;
  @ApiProperty() row_count?: number;
  @ApiProperty() error_message?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ReportJobPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ReportJobDto] })
  data: ReportJobDto[];
}

export class GenerateReportDto {
  @ApiProperty() report_type: string;
  @ApiPropertyOptional() parameters?: Record<string, any>;
}

export class ReportDownloadUrlDto {
  @ApiProperty({ nullable: true })
  url: string | null;
  @ApiPropertyOptional()
  expiresAt?: Date;
}
