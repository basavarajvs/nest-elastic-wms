import { IsString, IsUUID, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, IsObject, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderLineDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  requestedQuantity: number;

  @IsUUID()
  uomId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsUUID()
  facilityId: string;

  @IsString()
  clientCode: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsObject()
  deliveryAddress?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  requestedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines: CreateOrderLineDto[];
}
