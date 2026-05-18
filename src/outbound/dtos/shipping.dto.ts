import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ShipmentLoadDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  loadId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  shipmentId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  dockDoorCode: string;
}

export class GenerateManifestDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  shipmentId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  carrierCode?: string;
}
