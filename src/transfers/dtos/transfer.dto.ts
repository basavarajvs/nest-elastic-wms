import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
