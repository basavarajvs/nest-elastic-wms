import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto {
  @ApiProperty({ description: 'Total number of records matching the query' })
  total: number;

  @ApiProperty({ description: 'Current page number (1-indexed)' })
  page: number;

  @ApiProperty({ description: 'Number of records per page' })
  limit: number;
}

export class DeleteResultDto {
  @ApiProperty({ description: 'Number of records affected' })
  count: number;
}
