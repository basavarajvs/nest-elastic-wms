import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsObject } from 'class-validator';

export class SoftAllocateDto {
  @IsUUID()
  orderId: string;
}

export class AllocationOverrideDto {
  @IsUUID()
  allocationId: string;

  @IsUUID()
  substituteLotId: string;

  @IsUUID()
  substituteLocationId: string;

  @IsString()
  reason: string;
}
