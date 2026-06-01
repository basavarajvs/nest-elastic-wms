import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export class ReplenishmentSuggestionDto {
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() productSku: string;
  @ApiProperty() pickLocationId: string;
  @ApiProperty() pickLocationCode: string;
  @ApiProperty() currentQuantity: number;
  @ApiProperty() minQuantity: number;
  @ApiProperty() maxQuantity: number;
  @ApiProperty() suggestedQuantity: number;
  @ApiProperty() bulkLocationId: string;
  @ApiProperty() bulkLocationCode: string;
}

export class CreateReplenishmentTaskDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  fromLocationId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  toLocationId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(1)
  requestedQuantity: number;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteReplenishmentTaskDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  fulfilledQuantity: number;
}

export class ReplenishmentFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
