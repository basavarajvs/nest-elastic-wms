import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';

export class CreateRateDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() rateCode: string;
  @ApiProperty() @IsString() rateName: string;
  @ApiProperty({ enum: ['PER_PALLET', 'PER_SQFT', 'PER_CUBIC_FOOT', 'FLAT'] }) @IsString() rateType: string;
  @ApiProperty({ enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'] }) @IsString() calculationBasis: string;
  @ApiProperty() @IsNumber() defaultRate: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minCharge?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() maxCharge?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateClientRateDto {
  @ApiProperty() @IsString() rateMasterId: string;
  @ApiProperty() @IsString() clientId: string;
  @ApiProperty() @IsNumber() negotiatedRate: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
}

export class CreateBillingCycleDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() cycleCode: string;
  @ApiProperty() @IsString() cycleName: string;
  @ApiProperty({ enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY'] }) @IsString() frequency: string;
  @ApiProperty() @IsInt() @Min(1) billingDay: number;
}

export class GenerateSnapshotDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsDateString() snapshotDate: string;
  @ApiProperty() @IsString() clientId: string;
}

export class CalculateChargesDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cycleId?: string;
}

export class GenerateInvoiceDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() clientId: string;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiProperty() @IsDateString() dueDate: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] }) @IsString() status: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ListRatesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() facilityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rateType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isActive?: string;
}

export class ListSnapshotsDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() snapshotDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
}

export class ListChargesDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class ListInvoicesDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
