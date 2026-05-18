import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ShipmentLoadDto {
  @IsString()
  loadId: string;

  @IsUUID()
  shipmentId: string;

  @IsString()
  dockDoorCode: string;
}

export class GenerateManifestDto {
  @IsUUID()
  shipmentId: string;

  @IsOptional()
  @IsString()
  carrierCode?: string;
}
