import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, IsObject, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderLineDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  requestedQuantity: number;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  uomId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  clientCode: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  orderType?: string;

  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  @IsNumber()
  priority?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  deliveryAddress?: Record<string, any>;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsDateString()
  requestedDeliveryDate?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['CREATED', 'VALIDATED', 'ALLOCATED', 'WAVED', 'PICKED', 'PACKED', 'SHIPPED', 'CLOSED', 'CANCELLED', 'ON_HOLD'], description: 'New order status' })
  @IsString()
  status: string;
}
