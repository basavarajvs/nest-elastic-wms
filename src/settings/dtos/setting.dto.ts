import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class SystemSettingDto {
  @ApiProperty() setting_key: string;
  @ApiProperty() value: string;
  @ApiProperty() description?: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class SystemSettingHistoryDto {
  @ApiProperty() setting_key: string;
  @ApiProperty() old_value: any;
  @ApiProperty() new_value: any;
  @ApiProperty() changed_by: string;
  @ApiProperty() changed_at: Date;
}

export class UpsertSettingDto {
  @ApiProperty() value: string;
  @ApiPropertyOptional() description?: string;
}

export class UpdateSettingValueDto {
  @ApiProperty() value: string;
}

export class SettingPaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [SystemSettingDto] })
  data: SystemSettingDto[];
}
