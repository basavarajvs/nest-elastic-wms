import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateProductSupplierDto {
  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  vendorId: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  vendorSku?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  currency?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  moq?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  isPreferred?: boolean;
}

export class UpdateProductSupplierDto {
  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  vendorSku?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  currency?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  moq?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  isPreferred?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  isActive?: boolean;
}
