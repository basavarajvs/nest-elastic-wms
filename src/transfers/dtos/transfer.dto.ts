import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WebReceiveTransferDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  lpnNumber: string;
}

export class UpdateTransferLineDto {
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Min(0)
  quantityRequested?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Min(0)
  quantityShipped?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Min(0)
  quantityReceived?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  status?: string;
}

export class TransferLineFilterDto {
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsUUID()
  transferId?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsUUID()
  productId?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  status?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class TransferLineDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  lotId?: string;

  @IsNumber()
  @Min(0.001)
  quantityRequested: number;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  uomId: string;
}

export class CreateTransferDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsEnum(['INTRA_FACILITY', 'INTER_FACILITY', 'CUSTOMER_RETURN', 'VENDOR_RETURN'])
  transferType: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  fromLocationId?: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  toLocationId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  toFacilityId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];
}

export class ReceiveLpnTransferDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  transferId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  lpnNumber: string;
}
