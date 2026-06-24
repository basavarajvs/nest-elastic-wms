import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListCustomerQueryDto {
  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  limit?: number;

  @ApiPropertyOptional()
  search?: string;
}
