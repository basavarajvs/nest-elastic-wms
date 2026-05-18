import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferLineDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  lotId?: string;

  @IsNumber()
  @Min(0.001)
  quantityRequested: number;

  @IsUUID()
  uomId: string;
}

export class CreateTransferDto {
  @IsUUID()
  facilityId: string;

  @IsEnum(['INTRA_FACILITY', 'INTER_FACILITY', 'CUSTOMER_RETURN', 'VENDOR_RETURN'])
  transferType: string;

  @IsOptional()
  @IsUUID()
  fromLocationId?: string;

  @IsUUID()
  toLocationId: string;

  @IsOptional()
  @IsUUID()
  toFacilityId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];
}

export class ReceiveLpnTransferDto {
  @IsUUID()
  transferId: string;

  @IsString()
  lpnNumber: string;
}
