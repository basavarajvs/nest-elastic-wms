import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

enum ReturnStatusEnum {
  EXPECTED = 'EXPECTED',
  ARRIVED = 'ARRIVED',
  INSPECTING = 'INSPECTING',
  INSPECTED = 'INSPECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateCustomerReturnDto {
  @ApiPropertyOptional({ enum: ReturnStatusEnum })
  @IsOptional()
  @IsEnum(ReturnStatusEnum)
  status?: ReturnStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
