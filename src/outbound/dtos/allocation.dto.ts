import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsObject } from 'class-validator';

export class SoftAllocateDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  orderId: string;
}

export class AllocationOverrideDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  allocationId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  substituteLotId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  substituteLocationId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  reason: string;
}
