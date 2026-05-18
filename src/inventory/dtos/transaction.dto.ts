import { IsString, IsUUID, IsNumber, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum TransactionTypeDto {
  RECEIPT = 'RECEIPT',
  PUTAWAY = 'PUTAWAY',
  PICK = 'PICK',
  PACK = 'PACK',
  SHIP = 'SHIP',
  ADJUSTMENT_INCREASE = 'ADJUSTMENT_INCREASE',
  ADJUSTMENT_DECREASE = 'ADJUSTMENT_DECREASE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export class CreateTransactionDto {
  @IsUUID()
  facilityId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  locationIdTo?: string;

  @IsOptional()
  @IsUUID()
  lotId?: string;

  @IsEnum(TransactionTypeDto)
  transactionType: TransactionTypeDto;

  @IsNumber()
  quantity: number;

  @IsUUID()
  uomId: string;

  @IsString()
  referenceType: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  reasonCode?: string;

  @IsOptional()
  @IsString()
  performedByUserId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
