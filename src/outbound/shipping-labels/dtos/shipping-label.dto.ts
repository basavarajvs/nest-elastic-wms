import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class GenerateLabelDto {
  @ApiProperty({ type: String })
  @IsUUID()
  shipmentId: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsUUID()
  containerId?: string;

  @ApiProperty({ type: String })
  @IsString()
  labelType: string;

  @IsOptional()
  @ApiPropertyOptional({ type: String })
  @IsString()
  carrierCode?: string;
}

export class PrintLabelDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(1)
  copies: number;
}

export class ShippingLabelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  facilityId: string;

  @ApiProperty()
  shipmentId: string;

  @ApiPropertyOptional()
  containerId?: string;

  @ApiProperty()
  labelType: string;

  @ApiProperty()
  labelUrl: string;

  @ApiPropertyOptional()
  trackingNumber?: string;

  @ApiPropertyOptional()
  carrierCode?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  printedCount: number;

  @ApiPropertyOptional()
  lastPrintedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
