import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkOrderDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ enum: ['ASSEMBLY', 'DISASSEMBLY', 'KITTING', 'REPAIR', 'CUSTOM'] })
  @IsString()
  workOrderType: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({ enum: ['ASSEMBLY', 'DISASSEMBLY', 'KITTING', 'REPAIR', 'CUSTOM'] })
  @IsOptional()
  @IsString()
  workOrderType?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOperationDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  sequenceNumber: number;

  @ApiProperty({ type: String })
  @IsString()
  operationName: string;

  @ApiProperty({ enum: ['TASK', 'QUALITY_CHECK', 'MOVE', 'LABEL'] })
  @IsString()
  operationType: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOperationDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualMinutes?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateComponentDto {
  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  lotId?: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  quantityRequired: number;

  @ApiProperty({ type: String })
  @IsUUID()
  uomId: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
