import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  productId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  locationIdTo?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsUUID()
  lotId?: string;

  @ApiProperty({ required: true })
  @IsEnum(TransactionTypeDto)
  transactionType: TransactionTypeDto;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  quantity: number;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  uomId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  referenceType: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  referenceId?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  reasonCode?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  performedByUserId?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsObject()
  metadata?: Record<string, any>;
}
