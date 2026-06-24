import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateVasTaskDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsString()
  taskType: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRequired?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  ratePerUnit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVasTaskDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityCompleted?: number;

  @ApiPropertyOptional({ enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}
