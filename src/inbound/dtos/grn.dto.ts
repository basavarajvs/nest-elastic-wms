import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateGrnFromAsnDto {
  @IsString()
  asnNumber: string;
}

export class CreateGrnAdHocDto {
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  poNumber?: string;

  @IsOptional()
  @IsBoolean()
  qcRequired?: boolean;
}

export class RfReceiveDto {
  @IsUUID()
  grnLineId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  lpnNumber?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damagedQuantity?: number;
}
