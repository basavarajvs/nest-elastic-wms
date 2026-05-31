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
